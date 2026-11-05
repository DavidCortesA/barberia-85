# Fase 4 — Sitio público y reservaciones · 85 BARBERÍA

## Qué quedó construido

| Ruta | Contenido |
|---|---|
| `/` | Hero, servicios (desde Supabase), nosotros, galería (solo si hay fotos), contacto; JSON-LD `HairSalon` |
| `/servicios` | Lista completa de servicios activos |
| `/contacto` | Ubicación, horarios (agrupados), teléfono, WhatsApp, redes |
| `/reservar` | Wizard de 5 pasos: servicio → día → hora → datos → revisión, con pantalla de éxito |
| `/api/availability` | `GET ?service=<uuid>&date=yyyy-MM-dd` → horarios (calculados en el servidor, `no-store`) |
| `/sitemap.xml`, `/robots.txt` | SEO básico; `/admin`, `/login` y `/api` excluidos |

Todas las páginas tienen metadata propia, estados de carga (skeletons), vacío y error, y se regeneran cada 60 s (ISR) para que los cambios del admin aparezcan sin redeploy.

## Todo es administrable

El cliente pidió que fotos, textos y "todo" se administren desde el dashboard. El modelo ya está implementado; **la pantalla del panel se construye en la Fase 5** (el panel aún no existe).

**Dónde vive cada cosa**

| Qué | Dónde se guarda | Editor (Fase 5) |
|---|---|---|
| Textos e imágenes de portada, servicios, nosotros, galería (encabezado), contacto, reservaciones y SEO | tabla `site_content` (clave → valor) | `/admin/content` |
| Fotos de la galería (orden, visibilidad, texto alternativo) | tabla `gallery_images` | `/admin/content` → Galería |
| Servicios (nombre, descripción, precio, duración, **foto**, activo) | tabla `services` | `/admin/services` |
| Dirección, teléfono, WhatsApp, redes, horarios, reglas de reserva | `business_settings`, `business_hours`, `schedule_exceptions` | `/admin/settings`, `/admin/schedule` |
| Archivos de imagen | Supabase Storage, bucket público `media` (solo admin escribe, ≤ 5 MB, JPG/PNG/WebP/AVIF) | subida desde los formularios |

**Cómo funciona `site_content`**

- La lista de campos editables y sus textos por defecto está en [`src/features/content/registry.ts`](../src/features/content/registry.ts). El panel generará su formulario a partir de esa lista, así que agregar un texto editable es agregar una línea.
- El sitio muestra el valor guardado y, si no hay (o está vacío), el valor por defecto. **Borrar un texto equivale a restaurar el original.**
- Los textos por defecto marcados "temporal" (p. ej. *Nosotros*) son marcadores de posición.

**Alcance de `/admin/content` (Fase 5)**

- Secciones en pestañas: Portada, Servicios, Nosotros, Galería, Contacto, Reservaciones, SEO.
- Campos de texto, textos largos con contador de caracteres y campos de imagen con vista previa, subida y botón "quitar".
- Galería: subir varias fotos, reordenar, ocultar/mostrar, editar texto alternativo y eliminar con confirmación.
- Al guardar: validación con Zod en servidor, verificación de rol admin, y `revalidatePath` para que el sitio se actualice de inmediato.
- Enlace "Ver sitio" para revisar el resultado.

Mientras tanto se puede editar por SQL, por ejemplo:

```sql
insert into public.site_content (key, value) values ('hero.title_accent', 'te define')
on conflict (key) do update set value = excluded.value;
```

## Reglas de reserva (verificadas)

- El cliente nunca decide qué está libre: `/api/availability` combina horario (público) con citas y bloqueos ocupados (RPC solo para `service_role`, sin datos personales).
- La Server Action `createAppointmentRequestAction` valida con Zod, normaliza el teléfono (+52) y llama a `create_appointment_request()`, que **vuelve a validar todo bajo bloqueo** (horario, aviso mínimo, anticipación máxima, alineación, conflictos, máximo 2 pendientes por teléfono).
- Una pendiente bloquea el horario `pending_hold_minutes` (3 h por defecto). Las confirmadas lo bloquean siempre y la BD lo garantiza (constraint de exclusión).
- Honeypot oculto contra bots. Solo se registran códigos de error en el servidor, nunca nombre ni teléfono.
- WhatsApp: si el negocio configuró su número, la pantalla de éxito ofrece un enlace `wa.me` con mensaje prellenado; si no, el botón no aparece.

## Pruebas

```bash
npm test          # 51 pruebas (Vitest): disponibilidad, horarios, validaciones, teléfono, WhatsApp
npm run typecheck
npm run lint
npm run build
```

Además se recorrió el flujo completo en navegador (escritorio y móvil) contra la base real: la solicitud quedó `pending` con precio y duración congelados, la hora se guardó correctamente en UTC y los horarios traslapados dejaron de ofrecerse. Los datos de prueba se eliminaron.

## Pendiente / límites conocidos

- **Panel administrativo** (Fase 5): login, dashboard, calendario, citas, servicios, barberos, horarios, configuración y `/admin/content`.
- **Límite por IP:** hoy el freno anti-abuso es por teléfono (2 pendientes) + honeypot. Cuando se despliegue conviene activar Vercel Firewall para limitar peticiones por IP a `/api/availability` y a la reserva.
- Sin fotos reales no hay galería ni imagen de portada: se muestra el "85" en contorno. Los servicios de ejemplo (`[EJEMPLO]`) siguen visibles hasta que el admin los reemplace.
- Logo: sigue siendo el PNG derivado; falta la versión vectorial para pantallas muy grandes y favicon.
