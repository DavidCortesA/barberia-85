-- =====================================================================
-- 85 BARBERÍA · Funciones del panel administrativo (Fase 5)
--
--   · admin_replace_business_hours(jsonb) → reemplaza el horario semanal
--     completo en UNA transacción (si algo falla, no se pierde el horario).
--
-- SECURITY INVOKER: corre con los permisos del usuario que llama, así que
-- RLS (solo admin escribe business_hours) sigue aplicando. Además se exige
-- is_admin() explícitamente para fallar con un error claro.
-- =====================================================================

create function public.admin_replace_business_hours(p_hours jsonb)
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

  delete from public.business_hours where true;

  insert into public.business_hours (day_of_week, opening_time, closing_time, is_closed)
  select
    (h ->> 'day_of_week')::smallint,
    nullif(h ->> 'opening_time', '')::time,
    nullif(h ->> 'closing_time', '')::time,
    coalesce((h ->> 'is_closed')::boolean, false)
  from jsonb_array_elements(p_hours) as h;
end;
$$;

revoke all on function public.admin_replace_business_hours(jsonb) from public, anon;
grant execute on function public.admin_replace_business_hours(jsonb) to authenticated, service_role;
