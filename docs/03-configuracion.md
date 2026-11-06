# Fase 3 — Configuración · 85 BARBERÍA

## Qué quedó configurado

| Área | Detalle |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack), React 19, TypeScript estricto |
| Estilos | Tailwind CSS 4; tokens de marca en `src/app/globals.css` (`brand-*`, `ink-*`, `st-*`, `font-display`) |
| UI | shadcn/ui (estilo `base-nova`, sobre `@base-ui/react`), Lucide, Sonner fijo en tema oscuro |
| Animación | `motion` (Framer Motion) — componente `Reveal` con `prefers-reduced-motion` |
| Formularios | React Hook Form + `@hookform/resolvers` + Zod 4 |
| Fechas | date-fns 4 + `@date-fns/tz`; toda la zona horaria vive en `src/lib/date` |
| Supabase | clientes `client.ts` (navegador), `server.ts` (sesión + RLS), `admin.ts` (service role, `server-only`), `proxy.ts` (refresco de sesión) |
| Protección | `src/proxy.ts`: `/admin/*` sin sesión → `/login`. Primera barrera; el rol se revalida en layout, acciones y RLS |
| Config | `src/config/site.ts` (datos editables/temporales), `env.ts` (públicas), `env.server.ts` (secretas, `server-only`) |

## Decisiones técnicas

- **`cacheComponents` desactivado.** La plantilla de Next 16.4 lo trae activo; lo quité para que las páginas con cookies (admin) no exijan `<Suspense>` en cada ruta. Se puede reevaluar cuando Next lo haga obligatorio.
- **Dependencias fuera del listado original y su razón:** `@supabase/supabase-js` + `@supabase/ssr` (cliente y sesión por cookies), `@hookform/resolvers` (Zod ↔ RHF), `@date-fns/tz` (zonas horarias), `motion` (animaciones pedidas), `server-only` (impide importar módulos secretos en el cliente), `supabase` (CLI, dev) para migraciones y tipos. Las agregan shadcn: `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `react-day-picker`, `tw-animate-css`.
- **Agregadas después:** Vitest (Fase 4) y FullCalendar 6.1 (`@fullcalendar/react`, `core`, `daygrid`, `timegrid`, `interaction`; Fase 5, calendario del panel).
- Tokens renombrados respecto al diseño: `amber-*` → `brand-*` para no pisar la escala `amber` de Tailwind.

## Base de datos (Supabase)

Migraciones en `supabase/migrations/` (ya aplicadas al proyecto remoto) y datos de ejemplo en `supabase/seed.sql`.

| Archivo | Contenido |
|---|---|
| `…170000_schema.sql` | Tipos, 10 tablas, constraints (exclusión de citas confirmadas traslapadas, rangos, formato de teléfono), índices, perfil automático al crear usuario |
| `…170100_functions.sql` | `is_admin()`, validación de horario, trigger de integridad (transiciones de estado, campos inmutables, bloqueos), historial de estados, `create_appointment_request()`, `get_busy_intervals()`, `expire_stale_pending()` |
| `…170200_rls.sql` | RLS en todas las tablas, permisos mínimos, bucket `media` y sus políticas |
| `…180000_content.sql` | `site_content` y `gallery_images` (Fase 4) |
| `…120000_admin.sql` | `admin_replace_business_hours(jsonb)`: horario semanal en una transacción (Fase 5) |
| `…120100_media_select.sql` | Política SELECT de `storage.objects` para el admin (necesaria para borrar fotos) |
| `…130000_barber_hours.sql` | Horario de trabajo por barbero y `admin_replace_barber_hours()` |
| `…140000_staff_role.sql` | Rol recepción (`staff`): `has_panel_access()`, políticas y guardia de columnas en citas |

Reglas implementadas en la base: pendiente bloquea el horario `pending_hold_minutes` (3 h por defecto); confirmada bloquea siempre y la BD lo garantiza; máximo 2 pendientes por teléfono; aviso mínimo, anticipación máxima y alineación a `slot_interval_minutes`.

### Comandos

El host directo de la BD (`db.<ref>.supabase.co`) es solo IPv6; en este equipo se usa el **session pooler** (`aws-0-us-east-1.pooler.supabase.com:5432`, usuario `postgres.<ref>`).

```bash
# Aplicar migraciones (usa la contraseña de SUPABASE_DB_PASSWORD, URL-encoded)
npx supabase db push --db-url "postgresql://postgres.<ref>:<password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Regenerar tipos
npx supabase gen types typescript --db-url "<misma url>" --schema public > src/types/database.ts
```

### Verificación realizada

Se ejecutó una batería de 35 pruebas contra la BD real (permisos de `anon`, reglas de reserva, constraint de exclusión, transiciones, bloqueos, historial) y todas pasaron; los datos de prueba se eliminaron. Esas pruebas se formalizarán en la Fase 6.

## Acciones manuales pendientes (no se pueden hacer por migración)

1. **Desactivar el registro público:** Supabase Dashboard → Authentication → Sign In / Providers → desactivar *Allow new users to sign up*.
2. **Crear el usuario admin** (Fase 5): se crea en Authentication → Users y se promueve con
   `update public.profiles set role = 'admin' where id = '<uuid>';`
3. **Rotar la clave si se expuso:** `SUPABASE_SECRET_KEY` nunca debe ir al chat ni al repo.
