-- =====================================================================
-- 85 BARBERÍA · Row Level Security y permisos
--
-- Modelo:
--   · anon (visitante): SOLO lectura de datos públicos (servicios activos,
--     barberos activos, horarios, ajustes). Nada de clientes ni citas.
--   · authenticated con rol admin (public.is_admin()): gestión completa.
--   · service_role (solo servidor Next.js): flujo público de reservas vía RPC.
--   · Las funciones de reserva NO son ejecutables por anon/authenticated.
-- =====================================================================

-- Punto de partida: sin privilegios para anon/authenticated; se concede lo mínimo.
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.business_settings,
  public.services,
  public.barbers,
  public.business_hours,
  public.schedule_exceptions
to anon;

grant select, insert, update, delete on
  public.profiles,
  public.business_settings,
  public.services,
  public.barbers,
  public.customers,
  public.business_hours,
  public.schedule_exceptions,
  public.blocked_slots,
  public.appointments
to authenticated;

grant select on public.appointment_events to authenticated;

-- Activar RLS en TODAS las tablas.
alter table public.profiles            enable row level security;
alter table public.business_settings   enable row level security;
alter table public.services            enable row level security;
alter table public.barbers             enable row level security;
alter table public.customers           enable row level security;
alter table public.business_hours      enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.blocked_slots       enable row level security;
alter table public.appointments        enable row level security;
alter table public.appointment_events  enable row level security;

-- ---------------------------------------------------------------------
-- profiles: cada usuario lee el suyo; el admin lee y administra todos.
-- (No hay política de INSERT: el perfil lo crea el trigger de Auth.)
-- ---------------------------------------------------------------------
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Datos públicos de lectura: lectura abierta, escritura solo admin.
-- ---------------------------------------------------------------------
create policy business_settings_select on public.business_settings
  for select to anon, authenticated using (true);
create policy business_settings_update_admin on public.business_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy services_select on public.services
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy services_write_admin on public.services
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy barbers_select on public.barbers
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy barbers_write_admin on public.barbers
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy business_hours_select on public.business_hours
  for select to anon, authenticated using (true);
create policy business_hours_write_admin on public.business_hours
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy schedule_exceptions_select on public.schedule_exceptions
  for select to anon, authenticated using (true);
create policy schedule_exceptions_write_admin on public.schedule_exceptions
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Datos privados: SOLO admin.
-- ---------------------------------------------------------------------
create policy customers_admin_all on public.customers
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy blocked_slots_admin_all on public.blocked_slots
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy appointments_admin_all on public.appointments
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy appointment_events_admin_select on public.appointment_events
  for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Storage: bucket público "media" (fotos de servicios y barberos).
-- Lectura pública por URL; escritura solo admin; solo imágenes ≤ 5 MB.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_insert_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy media_update_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy media_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
