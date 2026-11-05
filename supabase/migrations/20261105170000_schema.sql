-- =====================================================================
-- 85 BARBERÍA · Esquema base
-- Tablas, restricciones, índices y triggers de integridad.
-- RLS y permisos: 20261105170200_rls.sql
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.user_role as enum ('admin', 'staff');

create type public.appointment_status as enum (
  'pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'expired'
);

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: 1 fila por usuario de Supabase Auth. El ROL vive aquí
-- (nunca en user_metadata, que el usuario puede editar).
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'staff',
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil del usuario autenticado. role=admin concede acceso al panel. Se promueve a admin manualmente.';

-- ---------------------------------------------------------------------
-- business_settings: UNA sola fila (id siempre true).
-- ---------------------------------------------------------------------
create table public.business_settings (
  id                      boolean primary key default true check (id),
  name                    text not null default '85 BARBERÍA',
  address                 text,
  city                    text,
  phone                   text,
  whatsapp                text check (whatsapp is null or whatsapp ~ '^\d{10}$'),
  instagram               text,
  facebook                text,
  tiktok                  text,
  maps_url                text,
  timezone                text not null default 'America/Monterrey',
  slot_interval_minutes   integer not null default 30
                          check (slot_interval_minutes in (10, 15, 20, 30, 45, 60)),
  min_notice_minutes      integer not null default 60
                          check (min_notice_minutes between 0 and 10080),
  max_advance_days        integer not null default 30
                          check (max_advance_days between 1 and 365),
  pending_hold_minutes    integer not null default 180
                          check (pending_hold_minutes between 0 and 1440),
  max_pending_per_phone   integer not null default 2
                          check (max_pending_per_phone between 1 and 10),
  updated_at              timestamptz not null default now()
);

comment on table public.business_settings is
  'Configuración editable del negocio (fila única). Datos reales pendientes del cliente.';

create trigger business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

insert into public.business_settings (id) values (true);

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
create table public.services (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(btrim(name)) between 2 and 80),
  description       text check (description is null or char_length(description) <= 500),
  price             numeric(10, 2) not null check (price >= 0),
  duration_minutes  integer not null check (duration_minutes between 5 and 480),
  image_url         text,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index services_active_order_idx on public.services (is_active, sort_order);

create trigger services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- barbers (opcional en el MVP: la barbería opera como un solo recurso)
-- ---------------------------------------------------------------------
create table public.barbers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 2 and 80),
  specialty    text check (specialty is null or char_length(specialty) <= 120),
  description  text check (description is null or char_length(description) <= 500),
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index barbers_active_idx on public.barbers (is_active);

create trigger barbers_updated_at
  before update on public.barbers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- customers: se identifican por teléfono (E.164 México: +52XXXXXXXXXX)
-- ---------------------------------------------------------------------
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null check (char_length(btrim(full_name)) between 2 and 80),
  phone       text not null unique check (phone ~ '^\+52\d{10}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- business_hours: horario semanal en hora LOCAL de la barbería.
-- Permite varios rangos por día (p. ej. cerrar a la hora de comida).
-- day_of_week: 0 = domingo ... 6 = sábado.
-- ---------------------------------------------------------------------
create table public.business_hours (
  id            uuid primary key default gen_random_uuid(),
  day_of_week   smallint not null check (day_of_week between 0 and 6),
  opening_time  time,
  closing_time  time,
  is_closed     boolean not null default false,
  constraint business_hours_shape check (
    (is_closed and opening_time is null and closing_time is null)
    or (not is_closed and opening_time is not null and closing_time is not null
        and closing_time > opening_time)
  ),
  constraint business_hours_no_overlap exclude using gist (
    day_of_week with =,
    tsrange(date '2000-01-01' + opening_time, date '2000-01-01' + closing_time) with &&
  ) where (not is_closed)
);

create index business_hours_day_idx on public.business_hours (day_of_week);

-- ---------------------------------------------------------------------
-- schedule_exceptions: día cerrado u horario especial para una fecha.
-- Si existe una fila para la fecha, reemplaza al horario semanal.
-- ---------------------------------------------------------------------
create table public.schedule_exceptions (
  id              uuid primary key default gen_random_uuid(),
  exception_date  date not null unique,
  is_closed       boolean not null default true,
  opening_time    time,
  closing_time    time,
  note            text check (note is null or char_length(note) <= 200),
  created_at      timestamptz not null default now(),
  constraint schedule_exceptions_shape check (
    (is_closed and opening_time is null and closing_time is null)
    or (not is_closed and opening_time is not null and closing_time is not null
        and closing_time > opening_time)
  )
);

-- ---------------------------------------------------------------------
-- blocked_slots: bloqueos de agenda. barber_id NULL = afecta a toda la barbería.
-- ---------------------------------------------------------------------
create table public.blocked_slots (
  id              uuid primary key default gen_random_uuid(),
  barber_id       uuid references public.barbers (id) on delete cascade,
  start_datetime  timestamptz not null,
  end_datetime    timestamptz not null,
  reason          text check (reason is null or char_length(reason) <= 200),
  created_at      timestamptz not null default now(),
  constraint blocked_slots_range check (end_datetime > start_datetime)
);

create index blocked_slots_range_idx on public.blocked_slots (start_datetime, end_datetime);

-- ---------------------------------------------------------------------
-- appointments
--   · starts_at / ends_at (timestamptz, UTC) son la fuente de verdad.
--   · appointment_date es la fecha LOCAL (la fija el trigger) solo para filtrar.
--   · resource_key = barbero o, si no hay, un recurso único "la barbería".
--   · El constraint de exclusión impide dos citas CONFIRMADAS que se traslapen.
-- ---------------------------------------------------------------------
create table public.appointments (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references public.customers (id) on delete restrict,
  service_id         uuid not null references public.services (id) on delete restrict,
  barber_id          uuid references public.barbers (id) on delete restrict,
  starts_at          timestamptz not null,
  ends_at            timestamptz not null,
  appointment_date   date not null,
  status             public.appointment_status not null default 'pending',
  price_snapshot     numeric(10, 2) not null check (price_snapshot >= 0),
  duration_snapshot  integer not null check (duration_snapshot between 5 and 480),
  customer_notes     text check (customer_notes is null or char_length(customer_notes) <= 500),
  admin_notes        text check (admin_notes is null or char_length(admin_notes) <= 500),
  status_changed_at  timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  resource_key       uuid generated always as (
                       coalesce(barber_id, '00000000-0000-0000-0000-000000000000'::uuid)
                     ) stored,
  constraint appointments_range check (ends_at > starts_at),
  constraint appointments_duration_matches
    check (ends_at = starts_at + make_interval(mins => duration_snapshot)),
  constraint appointments_no_overlap_confirmed exclude using gist (
    resource_key with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmed')
);

create index appointments_date_status_idx on public.appointments (appointment_date, status);
create index appointments_starts_idx       on public.appointments (starts_at);
create index appointments_customer_idx     on public.appointments (customer_id);
create index appointments_service_idx      on public.appointments (service_id);
create index appointments_pending_idx      on public.appointments (created_at) where status = 'pending';

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- appointment_events: historial de estados (auditoría ligera)
-- ---------------------------------------------------------------------
create table public.appointment_events (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references public.appointments (id) on delete cascade,
  from_status     public.appointment_status,
  to_status       public.appointment_status not null,
  actor           uuid,  -- auth.uid() de quien cambió el estado; NULL = sistema/flujo público
  created_at      timestamptz not null default now()
);

create index appointment_events_appt_idx on public.appointment_events (appointment_id, created_at);

-- ---------------------------------------------------------------------
-- Perfil automático al crearse un usuario en Auth (siempre rol 'staff').
-- Promover a admin: update public.profiles set role = 'admin' where id = '<uuid>';
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
