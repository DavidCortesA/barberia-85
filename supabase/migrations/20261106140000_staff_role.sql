-- =====================================================================
-- 85 BARBERÍA · Rol "staff" (recepción)
--
-- Puede: ver citas, clientes e historial; confirmar, rechazar, cancelar y
-- completar citas; editar notas internas; ver y crear/quitar bloqueos de
-- agenda.
-- No puede: tocar servicios, barberos, horarios, configuración, contenido,
-- fotos ni usuarios; eliminar citas; mover una cita de horario.
--
-- RLS no restringe columnas, así que un trigger impide que staff cambie algo
-- distinto de estado y notas internas.
-- =====================================================================

-- ¿El usuario actual puede entrar al panel? (admin o staff)
create function public.has_panel_access()
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
      and p.role in ('admin', 'staff')
  );
$$;

revoke all on function public.has_panel_access() from public;
grant execute on function public.has_panel_access() to anon, authenticated, service_role;

-- Citas: leer y actualizar (no insertar ni borrar).
create policy appointments_panel_select on public.appointments
  for select to authenticated
  using ((select public.has_panel_access()));

create policy appointments_panel_update on public.appointments
  for update to authenticated
  using ((select public.has_panel_access()))
  with check ((select public.has_panel_access()));

-- Clientes e historial: solo lectura.
create policy customers_panel_select on public.customers
  for select to authenticated
  using ((select public.has_panel_access()));

create policy appointment_events_panel_select on public.appointment_events
  for select to authenticated
  using ((select public.has_panel_access()));

-- Servicios y barberos inactivos: visibles en el panel (citas históricas).
create policy services_panel_select on public.services
  for select to authenticated
  using ((select public.has_panel_access()));

create policy barbers_panel_select on public.barbers
  for select to authenticated
  using ((select public.has_panel_access()));

-- Bloqueos de agenda: leer, crear y quitar (no editar).
create policy blocked_slots_panel_select on public.blocked_slots
  for select to authenticated
  using ((select public.has_panel_access()));

create policy blocked_slots_panel_insert on public.blocked_slots
  for insert to authenticated
  with check ((select public.has_panel_access()));

create policy blocked_slots_panel_delete on public.blocked_slots
  for delete to authenticated
  using ((select public.has_panel_access()));

-- ---------------------------------------------------------------------
-- Guardia: quien no es admin solo puede cambiar estado y notas internas.
-- (service_role, que usa el flujo público y el cron, no tiene auth.uid y pasa.)
-- ---------------------------------------------------------------------
create function public.appointments_staff_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if new.starts_at       is distinct from old.starts_at
     or new.ends_at         is distinct from old.ends_at
     or new.barber_id       is distinct from old.barber_id
     or new.customer_notes  is distinct from old.customer_notes then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger appointments_staff_guard_trg
  before update on public.appointments
  for each row execute function public.appointments_staff_guard();
