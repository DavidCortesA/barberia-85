# Fases restantes · 85 BARBERÍA

Plan detallado de lo que falta para tener el producto en producción. Cada fase cierra con verificación (`typecheck`, `lint`, `test`, `build`), un commit y un tag anotado.

> Antes de empezar: lee [`00-nuevo-equipo.md`](00-nuevo-equipo.md) (entorno y acuerdos) y [`03-configuracion.md`](03-configuracion.md) (esquema y reglas de la base).

---

## Fase 5 — Panel administrativo (`v0.5.0`)

### Objetivo

Que el administrador opere la barbería sin tocar código ni SQL: ver y gestionar citas, administrar servicios, horarios y configuración, y **editar todos los textos y fotos del sitio público**.

### 5.0 Preparación (una sola vez)

1. **Registro público desactivado** en Supabase (Authentication → Sign In / Providers → *Allow new users to sign up* apagado). *Ya hecho.*
2. **Crear el usuario admin.** Supabase → Authentication → Users → *Add user* → *Create new user* (correo + contraseña fuerte, marcar auto-confirmar). La contraseña no se comparte por chat ni se guarda en el repo. Luego, en el SQL Editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'CORREO_DEL_ADMIN');
   ```

   (El trigger de Auth crea el perfil con rol `staff`; el ascenso a `admin` es siempre manual.)
3. Opcional: `scripts/create-admin.mjs` que haga lo anterior con la clave secreta y pida los datos por consola.

### 5.1 Autenticación y estructura del panel

- `src/app/(auth)/login/page.tsx`: formulario (React Hook Form + Zod) con `signInWithPassword` en una Server Action. Mensajes de error genéricos ("Correo o contraseña incorrectos"), sin revelar si el correo existe. Hoy `/login` responde 404.
- `src/features/auth/dal.ts`: `requireAdmin()` → verifica sesión con `getClaims()` **y** que `profiles.role = 'admin'`; si falla, `redirect("/login")`. Se llama en `admin/layout.tsx` y **al inicio de cada Server Action** (`proxy.ts` es solo la primera barrera).
- Acción de cerrar sesión.
- `src/app/admin/layout.tsx`: barra lateral de 240 px (iconos en tablet, menú inferior en móvil), topbar, enlace "Ver sitio". Estilo según `docs/02-diseno.md` §4.
- Componente único `StatusBadge` (color + icono + texto) para los 6 estados.
- Patrón de mutaciones: Server Action → `requireAdmin()` → Zod → cliente con sesión (`createClient()` de `server.ts`, RLS activo) → `revalidatePath("/", "layout")` si afecta al sitio público → resultado `{ ok, message }` → `toast`.
- **Aceptación:** un visitante sin sesión y un usuario `staff` autenticado no pueden entrar a `/admin` ni ejecutar acciones; un admin sí.

### 5.2 Dashboard (`/admin`)

- Tarjetas: citas de hoy, pendientes, confirmadas, canceladas.
- "Próximas citas" con acciones rápidas (confirmar, rechazar, WhatsApp).
- Franja de actividad de los últimos 7 días (sin gráficas decorativas).
- Datos con consultas agregadas en servidor (usar `appointment_date` y la zona `America/Monterrey`).
- Skeletons, estado vacío ("Aún no hay citas hoy") y error.

### 5.3 Citas (`/admin/appointments`)

- Tabla: cliente, teléfono, servicio, fecha, hora, duración, precio, estado, acciones. Filtros por estado y fecha, búsqueda por nombre/teléfono, paginación.
- Hoja lateral de detalle con notas del cliente, notas internas (`admin_notes`) e historial (`appointment_events`).
- Acciones (Server Actions): **confirmar, rechazar, cancelar, completar**, cada una con `AlertDialog` de confirmación.
- Errores esperados y su mensaje: `23P01` (otra cita confirmada ocupa ese horario), `slot_blocked` (hay un bloqueo), `invalid_status_transition`, `too_early_to_complete`.
- Pendientes cuya hora ya pasó: mostrarlas como vencidas (la función `expire_stale_pending()` las marca `expired`).
- **WhatsApp:** al confirmar, ofrecer abrir `wa.me` con `confirmationMessage()` (`src/lib/whatsapp`). No se envía nada automático.
- Si una pendiente se traslapa con otra pendiente, avisar y permitir rechazar las demás.

### 5.4 Calendario (`/admin/calendar`)

- Instalar FullCalendar: `@fullcalendar/react`, `core`, `daygrid`, `timegrid`, `interaction` (verificar compatibilidad con React 19 antes de instalar).
- Vistas mes/semana/día, colores por estado, filtros por estado, clic → hoja de detalle (la misma de 5.3).
- **Zona horaria:** enviar eventos con `toFloatingIso()` (`src/lib/date`) y `timeZone: "UTC"`; así no hace falta un plugin de zonas con nombre.
- Mostrar bloqueos de agenda como bandas rayadas y las horas fuera de atención atenuadas (`businessHours` de FullCalendar).
- Las vistas por recurso (columna por barbero) son de pago: no se usan; basta un filtro.

### 5.5 Servicios (`/admin/services`)

- CRUD completo: nombre, descripción, precio, duración, orden, activo/inactivo y **foto**.
- Preferir **desactivar** a eliminar (hay citas históricas que referencian el servicio; la BD lo impide con `on delete restrict`).
- `ImageUpload` reutilizable: sube al bucket público `media` (solo admin escribe; ≤ 5 MB; JPG/PNG/WebP/AVIF). Validar tipo y tamaño también en el servidor, nombre de archivo `uuid.ext` en carpetas por tema (`services/`, `content/`, `gallery/`, `barbers/`), vista previa, botón "quitar" y borrado del archivo anterior al reemplazar.
- Reordenar con botones subir/bajar sobre `sort_order` (sin librerías de arrastre).
- Cambios visibles en el sitio de inmediato (`revalidatePath`).

### 5.6 Barberos (`/admin/barbers`)

- CRUD: nombre, especialidad, descripción, foto, activo. Opcional en el MVP: hoy la barbería opera como un solo recurso y el sitio no muestra selector de barbero.
- Dejar documentado que activar la selección de barbero en el flujo público requeriría: UI en el wizard, `p_barber_id` en la acción y disponibilidad por barbero (la BD y `get_busy_intervals` ya lo soportan).

### 5.7 Horarios (`/admin/schedule`)

- Editor semanal con **varios rangos por día** (p. ej. cierre a la hora de comida) y días de descanso. Validar que no se traslapen (la BD también lo impide).
- Excepciones por fecha (`schedule_exceptions`): cierre total u horario especial.
- Bloqueos de agenda (`blocked_slots`): rango, motivo, opcionalmente por barbero. **Advertir** si el bloqueo cae sobre citas confirmadas (no se cancelan automáticamente).
- Intervalo entre horarios, aviso mínimo, anticipación máxima y retención de pendientes (`business_settings`) pueden vivir aquí o en 5.8.

### 5.8 Configuración (`/admin/settings`)

- `business_settings` (fila única): nombre, dirección, ciudad, teléfono, WhatsApp (10 dígitos), enlace de Google Maps, redes (aceptar `@usuario` o URL), zona horaria, `slot_interval_minutes`, `min_notice_minutes`, `max_advance_days`, `pending_hold_minutes`, `max_pending_per_phone`.
- Con el WhatsApp configurado, el botón aparece solo en contacto y en la pantalla de éxito de la reserva.

### 5.9 Contenido del sitio (`/admin/content`) — pedido expreso del cliente

Todo texto y foto del sitio público debe poder cambiarse desde el panel. El modelo **ya existe** (Fase 4): tablas `site_content` y `gallery_images`, y el registro de campos `src/features/content/registry.ts`.

- Pestañas por sección (`contentSections`): Portada, Servicios, Nosotros, Galería, Contacto, Reservaciones, SEO.
- Formulario **generado desde `contentFields`**: texto, texto largo (contador de `maxLength`) e imagen (con `ImageUpload`). Mostrar el valor por defecto como referencia y un botón "Restaurar original" (guardar vacío = restaurar).
- Guardado con `upsert` por clave en `site_content`, validando que la clave exista en el registro (`isContentKey`) y el largo máximo, solo admin.
- **Galería:** subir varias fotos, texto alternativo (accesibilidad), orden (subir/bajar), mostrar/ocultar y eliminar con confirmación. La sección pública se oculta sola si no hay fotos.
- Vista previa: enlace "Ver sitio" en nueva pestaña; tras guardar, `revalidatePath("/", "layout")`.
- Agregar un campo editable nuevo = agregar una línea al registro (el formulario y el sitio lo recogen).
- **Aceptación:** cambiar el título de la portada, subir la foto de portada, agregar 3 fotos a la galería y ver el resultado en `/` sin redeploy.

### 5.10 Tareas programadas y cierre

- `src/app/api/cron/keepalive/route.ts`: protegido con `Authorization: Bearer ${CRON_SECRET}`; hace una consulta mínima (evita que Supabase Free pause el proyecto por inactividad) y ejecuta `expire_stale_pending()`.
- `vercel.json` con un cron diario hacia esa ruta (Vercel Hobby permite cron diario).
- Dependencias nuevas permitidas en esta fase (justificadas): FullCalendar. Nada más sin justificar.
- **Cierre:** `npm run typecheck && npm run lint && npm test && npm run build && npm run test:db`; recorrer cada pantalla en 375 / 768 / 1280 px; actualizar docs; commit `feat: Fase 5 - …` + tag `v0.5.0`.

### Criterios de aceptación de la Fase 5

- [ ] Login funciona; `/admin/*` protegido para anónimos y para `staff`.
- [ ] Confirmar, rechazar, cancelar y completar citas con sus errores comprensibles.
- [ ] Calendario con vistas, filtros y colores por estado.
- [ ] CRUD de servicios con foto; barberos opcional; horarios con excepciones y bloqueos; configuración.
- [ ] `/admin/content` edita textos y fotos y el sitio público se actualiza.
- [ ] Estados de carga, vacío y error, confirmaciones y toasts en todas las pantallas.
- [ ] Verificaciones en verde y `v0.5.0` subido.

---

## Fase 6 — Pruebas, seguridad y despliegue (`v0.6.0` → `v1.0.0`)

### 6.1 Pruebas

- Mantener `npm test` (unitarias) y `npm run test:db` (37 comprobaciones contra la base real, incluida la concurrencia de 8 solicitudes simultáneas al mismo horario: solo 1 gana).
- **Matriz de permisos** nueva en `test:db`: anónimo / usuario `staff` / admin sobre cada tabla y función (lectura y escritura).
- Pruebas de las Server Actions del panel (rechazo sin sesión y sin rol admin, validaciones Zod).
- Conflictos de horario desde el panel: confirmar una pendiente cuando otra confirmada ya ocupa el hueco.
- Si se desea, pruebas de extremo a extremo con Playwright (el flujo de reserva y el login del admin).

### 6.2 Revisión de seguridad

- Buscar la clave secreta en el bundle del cliente (`.next/static`): no debe aparecer. Confirmar que ninguna variable secreta lleva prefijo `NEXT_PUBLIC`.
- Revisar RLS y permisos de las funciones (las de reserva solo para `service_role`).
- Cabeceras de seguridad en `next.config.ts` (CSP razonable, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`).
- Límite de peticiones por IP a `/api/availability` y a la reserva (Vercel Firewall o Rate Limiting); hoy solo hay límite por teléfono + honeypot. Valorar Cloudflare Turnstile si hay abuso.
- Rotar `SUPABASE_SECRET_KEY` y la contraseña de la base si alguna vez se expusieron; revisar que no haya secretos en el historial de git.
- Supabase Auth: política de contraseñas, expiración de sesión, URL del sitio y redirecciones permitidas = dominio real.
- Subida de imágenes: tipo, tamaño y nombre validados en servidor.

### 6.3 Calidad

- Revisión responsive en móvil, tablet y escritorio de **todas** las pantallas (público y admin).
- Accesibilidad: teclado completo, foco visible, contraste (≥ 4.5:1), etiquetas y `aria-live` en horarios; revisión con herramienta automática (axe/Lighthouse).
- Lighthouse en `/`, `/reservar` y `/servicios` (rendimiento, SEO, accesibilidad): corregir lo relevante.
- Optimizar imágenes subidas (se sirven con `next/image`; evitar fotos > 5 MB).
- Revisar textos: que no quede ningún `[EJEMPLO]` ni "texto temporal" visible en producción.

### 6.4 Despliegue en Vercel

1. Decidir plan: **Vercel Hobby es solo para uso no comercial** según sus términos; para el negocio real lo correcto es **Vercel Pro** (o migrar a otro hosting). Verificar los términos vigentes.
2. Importar el repo, framework Next.js. Variables de entorno (Production y Preview): `NEXT_PUBLIC_SITE_URL` (URL real), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `CRON_SECRET`. **No** subir `SUPABASE_DB_PASSWORD` (solo se usa en local).
3. Supabase → Authentication → URL Configuration: *Site URL* y *Redirect URLs* con el dominio real.
4. Dominio propio (opcional) y verificación de HTTPS.
5. Confirmar que el cron diario aparece en Vercel y que la ruta responde con el secreto.
6. Prueba de humo en producción: ver el sitio, reservar una cita de prueba, iniciar sesión como admin, confirmarla y borrarla.
7. Consideración de Supabase Free: se pausa tras ~7 días sin actividad (lo mitiga el cron) y **no incluye respaldos automáticos**. Configurar un respaldo semanal con `pg_dump` (GitHub Actions) o evaluar el plan Pro.
8. Commit + tag `v0.6.0`; tras la prueba de humo, tag `v1.0.0`.

### 6.5 Entrega al cliente

- Manual breve del administrador (cómo crear/confirmar citas, editar servicios, horarios y contenido, subir fotos), idealmente con capturas.
- Lista de accesos: Vercel, Supabase, GitHub, dominio. Cuenta del admin creada con una contraseña que solo conozca el cliente.
- Cómo pedir cambios y qué hacer si el sitio falla.

### Criterios de aceptación de la Fase 6

- [ ] Todas las pruebas en verde, incluida la matriz de permisos.
- [ ] Revisión de seguridad sin hallazgos abiertos de severidad alta.
- [ ] Lighthouse ≥ 90 en SEO y accesibilidad; rendimiento razonable en móvil.
- [ ] Sitio en producción con datos reales y prueba de humo superada.
- [ ] Respaldo configurado y documentado.
- [ ] `v1.0.0` subido.

---

## Datos pendientes del cliente

Sin esto el sitio funciona, pero muestra marcadores de posición.

- [ ] **Servicios reales** con nombre, descripción, duración y precio (hoy hay 3 `[EJEMPLO]`).
- [ ] **Horario de atención real** (hoy: lunes a sábado 10:00–19:00, domingo cerrado) y si hay cierre a la hora de comida.
- [ ] Dirección, ciudad, teléfono y **WhatsApp** (10 dígitos), enlace de Google Maps.
- [ ] Redes sociales (Instagram, Facebook, TikTok).
- [ ] **Fotografías**: portada (vertical 4:5), "Nosotros", 6–8 de galería (cortes e instalaciones) y de cada servicio, si se desea.
- [ ] **Textos**: presentación y filosofía ("Nosotros"), frase de portada y cualquier otro texto que quieran cambiar.
- [ ] **Logo en vectorial (SVG) o PNG de alta resolución con fondo transparente**, para el favicon y pantallas grandes (hoy hay un PNG derivado de 590 px).
- [ ] ¿Cuántos barberos atienden a la vez y si los clientes deben poder elegirlos? (Hoy: un solo recurso, sin selector.)
- [ ] Reglas: aviso mínimo, anticipación máxima y cuánto tiempo una solicitud pendiente bloquea el horario (hoy 60 min, 30 días y 3 h).
- [ ] Dominio y cuenta de hosting; decisión sobre Vercel Pro.

---

## Fuera del alcance del MVP (ideas para después)

Pagos en línea, WhatsApp Cloud API (mensajes automáticos), recordatorios, cuentas de cliente y cancelación por el cliente, selección de barbero con horarios individuales, reportes financieros, multi-sucursal, app móvil.
