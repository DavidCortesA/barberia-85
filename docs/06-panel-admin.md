# Fase 5 — Panel administrativo · 85 BARBERÍA

El administrador opera la barbería sin tocar código ni SQL: citas, calendario, servicios, barberos, horarios, configuración y **todos los textos y fotos del sitio público**.

## Primer acceso

1. Crear el usuario administrador (una sola vez, desde la carpeta del proyecto):

   ```bash
   npm run admin:create
   ```

   Pide correo y contraseña por consola (la contraseña no se muestra ni se guarda). Si el correo ya existe, solo le da rol `admin`. El registro público de Supabase está desactivado: nadie más puede crearse una cuenta.
2. Entrar en `/login`. Al terminar, "Cerrar sesión" en la barra lateral (o en "Más" en el móvil).

## Rutas

| Ruta | Qué hace |
|---|---|
| `/login` | Acceso con correo y contraseña. Errores genéricos ("Correo o contraseña incorrectos"); una cuenta sin rol admin se cierra y ve un aviso |
| `/admin` | Tarjetas (hoy, pendientes, confirmadas próximas, canceladas 7 días), próximas citas con Confirmar / Rechazar / WhatsApp y franja de los últimos 7 días |
| `/admin/appointments` | Tabla (tarjetas en móvil) con filtros por estado, periodo y fecha, búsqueda por nombre o teléfono y paginación de 20. Hoja lateral con detalle, notas internas e historial |
| `/admin/calendar` | FullCalendar mes/semana/día, chips de filtro por estado, colores por estado, bloqueos rayados y horas fuera de atención atenuadas |
| `/admin/services` | Alta/edición con foto, activo/inactivo, subir/bajar orden y eliminar (solo si nunca se reservó) |
| `/admin/barbers` | Alta/edición con foto, activo/inactivo, **horario de trabajo semanal** (días de descanso y varios rangos por día) y eliminar. Opcional en el MVP |
| `/admin/schedule` | Horario semanal con varios rangos por día, días especiales (cierre u horario distinto) y bloqueos de agenda |
| `/admin/settings` | Datos del negocio, WhatsApp, Google Maps, redes y reglas de reserva |
| `/admin/content` | Textos e imágenes de cada sección del sitio (pestañas) y gestor de la galería |
| `/api/admin/calendar` | `GET ?from&to` (máx. 62 días) → citas y bloqueos del rango. Solo admin (401 si no) |
| `/api/cron/keepalive` | Cron diario (Vercel): mantiene activo Supabase Free y marca como vencidas las pendientes pasadas |

## Roles

| | Recepción (`staff`) | Administración (`admin`) |
|---|---|---|
| Inicio, citas, calendario | ✅ ver, confirmar, rechazar, cancelar, completar, notas, WhatsApp | ✅ |
| Horarios | Ver el horario; crear y quitar **bloqueos** | ✅ todo (semanal, días especiales, bloqueos) |
| Servicios, barberos, contenido, configuración | — | ✅ |
| Usuarios (`/admin/users`) | — | ✅ crear cuentas, cambiar rol, nueva contraseña, eliminar |

- Las cuentas se crean en **Usuarios** (o la primera con `npm run admin:create`). La contraseña inicial la elige el admin y la comparte en persona. Nadie puede cambiar su propio rol ni eliminarse (evita quedarse sin administrador).
- En la base (migración `…140000_staff_role.sql`): `has_panel_access()` y políticas para que recepción lea citas, clientes e historial, actualice citas y maneje bloqueos. Un trigger impide que quien no es admin cambie algo distinto de estado y notas internas (no puede mover una cita de horario ni borrarla).
- Si recepción abre una pantalla de administración, vuelve al inicio con un aviso (`/admin?aviso=sin-permiso`).
- Opción futura: perfil **barbero** que solo vea sus citas (requiere ligar el usuario a un barbero y activar la selección de barbero al reservar).

## Seguridad (tres barreras)

1. `src/proxy.ts`: sin sesión en `/admin/*` → `/login?next=…`.
2. `src/features/auth/dal.ts`: `requireRole()` verifica la sesión con `getClaims()` **y** el rol en `profiles`. `requirePanel()` (admin o staff) protege layout, inicio, citas, calendario, horarios y sus acciones; `requireAdmin()` el resto. Se llama en cada página y **al inicio de cada Server Action**.
3. RLS en la base: aunque alguien saltara las dos anteriores, la base solo permite a cada rol lo de la tabla de arriba.

Las acciones usan el cliente **con sesión** (`createClient()` de `server.ts`), nunca la clave secreta. `next` en `/login` solo acepta rutas `/admin…` (sin redirecciones abiertas).

## Patrón de las mutaciones

`Server Action` → `requireAdmin()` → Zod → Supabase con sesión (RLS) → `revalidatePath("/", "layout")` si afecta al sitio → `{ ok, message }` → `toast`.

- `src/features/admin/result.ts`: `ActionResult`, `dbErrorMessage()` traduce los errores de la BD: `23P01` (otra cita confirmada en ese horario), `slot_blocked`, `invalid_status_transition`, `too_early_to_complete`, `23503` (tiene citas: desactívalo), `23505`.
- `src/components/admin/use-server-action.ts`: ejecuta la acción y muestra el toast.
- Acciones irreversibles con `ConfirmDialog` (AlertDialog).

## Citas

- **Estados:** `StatusBadge` único (color + icono + texto). Una pendiente cuya hora ya pasó se muestra como **Vencida**; el cron la marca `expired`.
- **Transiciones ofrecidas** (`allowedTransitions`): pendiente → confirmar / rechazar / cancelar (confirmar solo si aún no empieza); confirmada → cancelar, y completar cuando ya empezó. La BD vuelve a validar todo.
- **WhatsApp:** al confirmar, el toast ofrece abrir `wa.me` con `confirmationMessage()`; en el detalle siempre hay un botón de WhatsApp. No se envía nada automático.
- **Pendientes traslapadas:** al confirmar, si otras solicitudes pendientes pedían el mismo horario, se ofrece rechazarlas todas.

## Imágenes

- `ImageUpload` (servicios, barberos, contenido) y el gestor de galería suben así: el navegador valida tipo y tamaño → `createUploadTicketAction` valida otra vez **en el servidor**, decide el nombre `carpeta/uuid.ext` y devuelve una URL firmada de un solo uso → el navegador sube directo a Storage. Así no se topa con el límite de cuerpo de las Server Actions ni el de Vercel (4.5 MB), y el bucket vuelve a exigir imagen ≤ 5 MB.
- Al guardar, la acción borra del bucket la imagen anterior si se reemplazó o quitó; las subidas intermedias que no se guardan se descartan.
- Migración `…120100_media_select.sql`: sin una política SELECT sobre `storage.objects`, Supabase no borraba nada (las fotos reemplazadas quedaban huérfanas). Lo detectó `npm run test:db`.

## Horarios

- El horario semanal se guarda con `admin_replace_business_hours(jsonb)` (migración `…120000_admin.sql`): borra e inserta en **una transacción**, con `SECURITY INVOKER` (aplica RLS) y verificación de `is_admin()`. Si hay un traslape, no se pierde el horario anterior.
- Un bloqueo de agenda **no cancela** citas confirmadas: al crearlo se avisa cuántas hay en ese rango.

## Contenido del sitio

El formulario se genera desde `src/features/content/registry.ts`. Cada campo muestra el texto original como referencia, contador de caracteres y "Restaurar original" (guardar vacío = usar el original). La acción solo acepta claves del registro que pertenezcan a la sección y su largo máximo; las imágenes deben venir del bucket propio. **Agregar un campo editable nuevo = una línea en el registro.**

## Barberos y selección de barbero (pendiente de decisión del cliente)

Cada barbero tiene su horario de trabajo (tabla `barber_hours`, migración `…130000_barber_hours.sql`; se guarda en una transacción con `admin_replace_barber_hours`). Al abrirlo por primera vez se propone el horario de la barbería. Hoy es **informativo**: la agenda funciona como un solo recurso y el sitio no muestra selector. Para que los clientes elijan barbero haría falta:

1. UI en el wizard (`booking-wizard.tsx`): paso para elegir barbero (o "cualquiera").
2. Enviar `p_barber_id` en `createAppointmentRequestAction`.
3. Disponibilidad por barbero: pasar `p_barber_id` a `get_busy_intervals` en `getAvailability` (la BD y la RPC ya lo soportan) e intersectar el horario de la barbería con `barber_hours` (en `resolveRangesForDate` y en `slot_within_business_hours`).

## Pruebas

```bash
npm test             # 85 unitarias: lógica del panel, esquemas y autorización de acciones por rol
npm run test:db      # 37 reglas de reserva + 114 de matriz de permisos (anónimo/recepción/admin) y flujos (BD real)
npm run test:pages   # 27 de humo HTTP por rol (requiere npm run dev o npm start)
```

`test:db` y `test:pages` crean usuarios temporales (staff y admin) con contraseñas aleatorias que nunca se imprimen y los borran al terminar.
