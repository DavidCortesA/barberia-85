-- =====================================================================
-- 85 BARBERÍA · Funciones de negocio
--   · is_admin()                      → usada por las políticas RLS
--   · slot_within_business_hours()    → valida horario de atención
--   · appointments_guard() (trigger)  → integridad, transiciones, bloqueos
--   · create_appointment_request()    → ÚNICA vía para crear solicitudes
--   · get_busy_intervals()            → intervalos ocupados (sin datos personales)
--   · expire_stale_pending()          → limpieza de solicitudes vencidas
-- =====================================================================

-- ---------------------------------------------------------------------
-- is_admin(): true solo si el usuario actual tiene rol admin.
-- SECURITY DEFINER para poder leer profiles dentro de políticas RLS.
-- ---------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- slot_within_business_hours(inicio, fin)
-- Compara en la zona horaria del negocio. Una cita no puede cruzar medianoche.
-- ---------------------------------------------------------------------
create function public.slot_within_business_hours(p_start timestamptz, p_end timestamptz)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz        text;
  v_date      date;
  v_end_date  date;
  v_t_start   time;
  v_t_end     time;
  v_exc       public.schedule_exceptions%rowtype;
begin
  select coalesce(timezone, 'America/Monterrey') into v_tz
  from public.business_settings limit 1;

  v_date     := (p_start at time zone v_tz)::date;
  v_end_date := (p_end   at time zone v_tz)::date;
  v_t_start  := (p_start at time zone v_tz)::time;
  v_t_end    := (p_end   at time zone v_tz)::time;

  if v_end_date <> v_date then
    return false;
  end if;

  select * into v_exc
  from public.schedule_exceptions
  where exception_date = v_date;

  if found then
    if v_exc.is_closed then
      return false;
    end if;
    return v_t_start >= v_exc.opening_time and v_t_end <= v_exc.closing_time;
  end if;

  return exists (
    select 1
    from public.business_hours bh
    where bh.day_of_week = extract(dow from v_date)::int
      and not bh.is_closed
      and v_t_start >= bh.opening_time
      and v_t_end   <= bh.closing_time
  );
end;
$$;

revoke all on function public.slot_within_business_hours(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.slot_within_business_hours(timestamptz, timestamptz) to service_role;

-- ---------------------------------------------------------------------
-- appointments_guard(): trigger de integridad.
--   INSERT : fija appointment_date, exige horario de atención y sin bloqueos.
--   UPDATE : valida transiciones de estado, congela campos clave,
--            revalida bloqueos al confirmar.
-- ---------------------------------------------------------------------
create function public.appointments_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz  text;
  v_check_blocks boolean := false;
begin
  select coalesce(timezone, 'America/Monterrey') into v_tz
  from public.business_settings limit 1;

  if tg_op = 'INSERT' then
    new.appointment_date := (new.starts_at at time zone v_tz)::date;

    if new.status in ('pending', 'confirmed') then
      if not public.slot_within_business_hours(new.starts_at, new.ends_at) then
        raise exception 'outside_business_hours' using errcode = 'P0001';
      end if;
      v_check_blocks := true;
    end if;

  else -- UPDATE
    if new.customer_id        is distinct from old.customer_id
       or new.service_id      is distinct from old.service_id
       or new.price_snapshot  is distinct from old.price_snapshot
       or new.duration_snapshot is distinct from old.duration_snapshot then
      raise exception 'immutable_fields' using errcode = 'P0001';
    end if;

    if new.starts_at is distinct from old.starts_at
       or new.ends_at is distinct from old.ends_at then
      new.appointment_date := (new.starts_at at time zone v_tz)::date;
      v_check_blocks := new.status in ('pending', 'confirmed');
    end if;

    if new.status is distinct from old.status then
      if not (
        (old.status = 'pending'   and new.status in ('confirmed', 'rejected', 'cancelled', 'expired'))
        or (old.status = 'confirmed' and new.status in ('cancelled', 'completed'))
      ) then
        raise exception 'invalid_status_transition' using errcode = 'P0001';
      end if;

      if new.status = 'completed' and new.starts_at > now() then
        raise exception 'too_early_to_complete' using errcode = 'P0001';
      end if;

      new.status_changed_at := now();
      if new.status = 'confirmed' then
        v_check_blocks := true;
      end if;
    end if;
  end if;

  if v_check_blocks and exists (
    select 1
    from public.blocked_slots b
    where tstzrange(b.start_datetime, b.end_datetime, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
      and (b.barber_id is null or new.barber_id is null or b.barber_id = new.barber_id)
  ) then
    raise exception 'slot_blocked' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger appointments_guard_trg
  before insert or update on public.appointments
  for each row execute function public.appointments_guard();

-- ---------------------------------------------------------------------
-- Historial de estados
-- ---------------------------------------------------------------------
create function public.log_appointment_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_events (appointment_id, from_status, to_status, actor)
    values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.appointment_events (appointment_id, from_status, to_status, actor)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return null;
end;
$$;

create trigger appointments_event_trg
  after insert or update of status on public.appointments
  for each row execute function public.log_appointment_event();

-- ---------------------------------------------------------------------
-- create_appointment_request(): ÚNICA vía para crear solicitudes públicas.
-- Solo service_role (Server Action de Next.js). Re-valida TODO en el servidor
-- bajo un advisory lock por recurso+fecha, de modo que dos clientes
-- simultáneos no pueden quedarse con el mismo horario.
-- Errores (message): invalid_input, service_not_found, barber_not_found,
--   too_soon, too_far, bad_slot_alignment, outside_business_hours,
--   slot_unavailable, too_many_pending
-- ---------------------------------------------------------------------
create function public.create_appointment_request(
  p_service_id  uuid,
  p_starts_at   timestamptz,
  p_full_name   text,
  p_phone       text,            -- E.164 MX: +52XXXXXXXXXX
  p_notes       text default null,
  p_barber_id   uuid default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_set        public.business_settings%rowtype;
  v_service    public.services%rowtype;
  v_ends_at    timestamptz;
  v_local_date date;
  v_minutes    integer;
  v_resource   uuid;
  v_customer   uuid;
  v_name       text := btrim(coalesce(p_full_name, ''));
  v_notes      text := nullif(btrim(coalesce(p_notes, '')), '');
  v_appt       public.appointments;
begin
  select * into v_set from public.business_settings limit 1;

  if char_length(v_name) not between 2 and 80
     or p_phone is null or p_phone !~ '^\+52\d{10}$'
     or (v_notes is not null and char_length(v_notes) > 500) then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;

  select * into v_service from public.services
  where id = p_service_id and is_active;
  if not found then
    raise exception 'service_not_found' using errcode = 'P0001';
  end if;

  if p_barber_id is not null and not exists (
    select 1 from public.barbers where id = p_barber_id and is_active
  ) then
    raise exception 'barber_not_found' using errcode = 'P0001';
  end if;

  v_ends_at    := p_starts_at + make_interval(mins => v_service.duration_minutes);
  v_local_date := (p_starts_at at time zone v_set.timezone)::date;
  v_minutes    := extract(hour   from (p_starts_at at time zone v_set.timezone))::int * 60
                + extract(minute from (p_starts_at at time zone v_set.timezone))::int;

  if p_starts_at < now() + make_interval(mins => v_set.min_notice_minutes) then
    raise exception 'too_soon' using errcode = 'P0001';
  end if;
  if p_starts_at > now() + make_interval(days => v_set.max_advance_days) then
    raise exception 'too_far' using errcode = 'P0001';
  end if;
  if extract(second from p_starts_at) <> 0 or v_minutes % v_set.slot_interval_minutes <> 0 then
    raise exception 'bad_slot_alignment' using errcode = 'P0001';
  end if;
  if not public.slot_within_business_hours(p_starts_at, v_ends_at) then
    raise exception 'outside_business_hours' using errcode = 'P0001';
  end if;

  v_resource := coalesce(p_barber_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Serializa solicitudes concurrentes para el mismo recurso y día.
  perform pg_advisory_xact_lock(hashtextextended(v_resource::text || v_local_date::text, 0));

  -- Conflicto con citas confirmadas, con pendientes dentro del "hold",
  -- o con bloqueos de agenda.
  if exists (
    select 1
    from public.appointments a
    where a.resource_key = v_resource
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_starts_at, v_ends_at, '[)')
      and (
        a.status = 'confirmed'
        or (a.status = 'pending'
            and a.created_at + make_interval(mins => v_set.pending_hold_minutes) > now())
      )
  ) or exists (
    select 1
    from public.blocked_slots b
    where tstzrange(b.start_datetime, b.end_datetime, '[)') && tstzrange(p_starts_at, v_ends_at, '[)')
      and (b.barber_id is null or p_barber_id is null or b.barber_id = p_barber_id)
  ) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  -- Cliente por teléfono (el último nombre capturado prevalece).
  insert into public.customers (full_name, phone)
  values (v_name, p_phone)
  on conflict (phone) do update set full_name = excluded.full_name
  returning id into v_customer;

  -- Límite anti-abuso: solicitudes pendientes futuras por teléfono.
  if (
    select count(*)
    from public.appointments a
    where a.customer_id = v_customer
      and a.status = 'pending'
      and a.starts_at > now()
  ) >= v_set.max_pending_per_phone then
    raise exception 'too_many_pending' using errcode = 'P0001';
  end if;

  insert into public.appointments (
    customer_id, service_id, barber_id, starts_at, ends_at, appointment_date,
    status, price_snapshot, duration_snapshot, customer_notes
  ) values (
    v_customer, v_service.id, p_barber_id, p_starts_at, v_ends_at, v_local_date,
    'pending', v_service.price, v_service.duration_minutes, v_notes
  )
  returning * into v_appt;

  return v_appt;
end;
$$;

revoke all on function public.create_appointment_request(uuid, timestamptz, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_appointment_request(uuid, timestamptz, text, text, text, uuid)
  to service_role;

-- ---------------------------------------------------------------------
-- get_busy_intervals(): intervalos que NO se pueden reservar en un rango.
-- Devuelve solo inicio/fin (sin datos personales). Para /api/availability.
-- ---------------------------------------------------------------------
create function public.get_busy_intervals(
  p_from       timestamptz,
  p_to         timestamptz,
  p_barber_id  uuid default null
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with s as (select pending_hold_minutes from public.business_settings limit 1)
  select a.starts_at, a.ends_at
  from public.appointments a, s
  where a.starts_at < p_to and a.ends_at > p_from
    and a.resource_key = coalesce(p_barber_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and (
      a.status = 'confirmed'
      or (a.status = 'pending'
          and a.created_at + make_interval(mins => s.pending_hold_minutes) > now())
    )
  union all
  select b.start_datetime, b.end_datetime
  from public.blocked_slots b
  where b.start_datetime < p_to and b.end_datetime > p_from
    and (b.barber_id is null or p_barber_id is null or b.barber_id = p_barber_id);
$$;

revoke all on function public.get_busy_intervals(timestamptz, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.get_busy_intervals(timestamptz, timestamptz, uuid) to service_role;

-- ---------------------------------------------------------------------
-- expire_stale_pending(): marca como 'expired' las solicitudes cuya hora ya pasó.
-- Se invoca desde el cron diario de Vercel.
-- ---------------------------------------------------------------------
create function public.expire_stale_pending()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.appointments
  set status = 'expired'
  where status = 'pending' and starts_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_stale_pending() from public, anon, authenticated;
grant execute on function public.expire_stale_pending() to service_role;
