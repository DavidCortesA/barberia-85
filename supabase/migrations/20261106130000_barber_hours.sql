-- =====================================================================
-- 85 BARBERÍA · Horario de trabajo por barbero
--
--   barber_hours : rangos semanales (hora LOCAL) en que trabaja cada barbero.
--                  Varios rangos por día; un día sin filas = descansa.
--   admin_replace_barber_hours(barbero, jsonb) : reemplaza su semana en UNA
--                  transacción (como admin_replace_business_hours).
--
-- Hoy la reserva pública funciona como un solo recurso (sin elegir barbero),
-- así que este horario es informativo para el panel. Cuando se active la
-- selección de barbero, la disponibilidad deberá cruzarse con esta tabla.
-- =====================================================================

create table public.barber_hours (
  id            uuid primary key default gen_random_uuid(),
  barber_id     uuid not null references public.barbers (id) on delete cascade,
  day_of_week   smallint not null check (day_of_week between 0 and 6),
  opening_time  time not null,
  closing_time  time not null,
  constraint barber_hours_range check (closing_time > opening_time),
  constraint barber_hours_no_overlap exclude using gist (
    barber_id with =,
    day_of_week with =,
    tsrange(date '2000-01-01' + opening_time, date '2000-01-01' + closing_time) with &&
  )
);

create index barber_hours_barber_idx on public.barber_hours (barber_id, day_of_week);

grant select on public.barber_hours to anon;
grant select, insert, update, delete on public.barber_hours to authenticated;

alter table public.barber_hours enable row level security;

create policy barber_hours_select on public.barber_hours
  for select to anon, authenticated using (true);
create policy barber_hours_write_admin on public.barber_hours
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create function public.admin_replace_barber_hours(p_barber_id uuid, p_hours jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if jsonb_typeof(p_hours) <> 'array' then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;

  delete from public.barber_hours where barber_id = p_barber_id;

  insert into public.barber_hours (barber_id, day_of_week, opening_time, closing_time)
  select
    p_barber_id,
    (h ->> 'day_of_week')::smallint,
    (h ->> 'opening_time')::time,
    (h ->> 'closing_time')::time
  from jsonb_array_elements(p_hours) as h;
end;
$$;

revoke all on function public.admin_replace_barber_hours(uuid, jsonb) from public, anon;
grant execute on function public.admin_replace_barber_hours(uuid, jsonb) to authenticated, service_role;
