-- =====================================================================
-- 85 BARBERÍA · Storage: el admin necesita SELECT sobre storage.objects
--
-- Supabase Storage consulta la fila antes de borrarla (remove) o de
-- reemplazarla; sin una política SELECT, el borrado "funciona" pero no
-- elimina nada y las fotos reemplazadas quedan huérfanas en el bucket.
-- La lectura pública de las imágenes sigue siendo por URL (bucket público),
-- así que esta política no expone nada nuevo a anon.
-- =====================================================================

create policy media_select_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
