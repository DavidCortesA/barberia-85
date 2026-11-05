-- =====================================================================
-- 85 BARBERÍA · Datos de ejemplo
--
-- TODO LO DE ESTE ARCHIVO ES TEMPORAL. Los nombres de servicios llevan el
-- prefijo [EJEMPLO] y los precios/horarios son marcadores de posición, NO son
-- datos reales del negocio. Reemplazar desde /admin cuando el cliente los
-- proporcione. Es idempotente: se puede ejecutar varias veces.
-- =====================================================================

-- Servicios de ejemplo
insert into public.services (name, description, price, duration_minutes, sort_order)
select v.name, v.description, v.price, v.duration_minutes, v.sort_order
from (values
  ('[EJEMPLO] Corte clásico',   'Dato de ejemplo. Reemplazar con el servicio real.', 150.00, 45, 10),
  ('[EJEMPLO] Barba',           'Dato de ejemplo. Reemplazar con el servicio real.', 100.00, 30, 20),
  ('[EJEMPLO] Corte + barba',   'Dato de ejemplo. Reemplazar con el servicio real.', 220.00, 60, 30)
) as v(name, description, price, duration_minutes, sort_order)
where not exists (select 1 from public.services s where s.name = v.name);

-- Horario semanal de ejemplo (lunes a sábado 10:00-19:00; domingo cerrado)
insert into public.business_hours (day_of_week, opening_time, closing_time, is_closed)
select d, '10:00', '19:00', false
from generate_series(1, 6) as d
where not exists (select 1 from public.business_hours);

insert into public.business_hours (day_of_week, opening_time, closing_time, is_closed)
select 0, null, null, true
where not exists (
  select 1 from public.business_hours where day_of_week = 0
);
