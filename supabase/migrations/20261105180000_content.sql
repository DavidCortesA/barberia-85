-- =====================================================================
-- 85 BARBERÍA · Contenido administrable del sitio público
--
--   site_content   : textos e imágenes de las secciones (clave → valor).
--                    Las claves válidas y sus valores por defecto viven en
--                    src/features/content/registry.ts; si una clave no existe
--                    aquí (o está vacía) el sitio usa el valor por defecto.
--   gallery_images : fotos de la galería (orden y visibilidad editables).
--
-- Lectura pública, escritura solo admin (se edita desde /admin/content).
-- =====================================================================

create table public.site_content (
  key         text primary key check (key ~ '^[a-z0-9_.]+$' and char_length(key) <= 80),
  value       text not null default '' check (char_length(value) <= 5000),
  updated_at  timestamptz not null default now()
);

create trigger site_content_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

create table public.gallery_images (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null check (char_length(image_url) <= 2000),
  alt         text check (alt is null or char_length(alt) <= 200),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index gallery_images_active_order_idx on public.gallery_images (is_active, sort_order);

-- Permisos y RLS
grant select on public.site_content, public.gallery_images to anon;
grant select, insert, update, delete on public.site_content, public.gallery_images to authenticated;

alter table public.site_content   enable row level security;
alter table public.gallery_images enable row level security;

create policy site_content_select on public.site_content
  for select to anon, authenticated using (true);
create policy site_content_write_admin on public.site_content
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy gallery_images_select on public.gallery_images
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy gallery_images_write_admin on public.gallery_images
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
