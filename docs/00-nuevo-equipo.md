# Retomar el proyecto en otro equipo

Guía para continuar **85 BARBERÍA** desde cero en una computadora nueva. Lo único que NO viaja con el repositorio son tus claves (`.env.local`); todo lo demás está en GitHub.

- Repositorio: <https://github.com/DavidCortesA/barberia-85> (rama `main`)
- Estado: Fases 1–5 completas (tags `v0.1.0` a `v0.5.0`). Sigue la Fase 6 → [`docs/05-fases-restantes.md`](05-fases-restantes.md)

## 1. Requisitos

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | 22 o superior (se usó 24) | Vitest exige `@types/node` ≥ 22 |
| npm | 10 o superior (se usó 11) | |
| Git | cualquiera reciente | |
| Docker | **no hace falta** | La base es Supabase en la nube; las migraciones se aplican con `npm run db:push` |

## 2. Clonar e instalar

```bash
git clone https://github.com/DavidCortesA/barberia-85.git
cd barberia-85

# Identidad de git SOLO para este repo (no toca tu configuración global)
git config user.name "DavidCortesA"
git config user.email "david.cortes.ayala@hotmail.com"

npm install
```

Si usas Windows, los avisos `LF will be replaced by CRLF` de git son normales.

## 3. Variables de entorno (`.env.local`)

`.env.local` está en `.gitignore` y **nunca** debe subirse. Copia la plantilla y rellénala:

```bash
cp .env.example .env.local
```

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local; la URL real en Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (`https://aruapjjnkvytehahckkv.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → *publishable* (pública, la protege RLS) |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → *secret*. **Solo servidor**, salta RLS |
| `SUPABASE_PROJECT_REF` | `aruapjjnkvytehahckkv` (la parte inicial de la URL del proyecto) |
| `SUPABASE_DB_PASSWORD` | La contraseña de la base. No se puede consultar: Supabase → Project Settings → Database → *Reset database password* (usa solo letras y números) |
| `CRON_SECRET` | Cualquier texto aleatorio largo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SUPABASE_POOLER_HOST` | Opcional; solo si el proyecto no está en `us-east-1` (Connect → Session pooler) |

Reglas de oro: las claves **no** se pegan en chats, issues ni commits; si alguna se expone, se rota en Supabase.

## 4. Comandos del día a día

```bash
npm run dev          # servidor local en http://localhost:3000
npm test             # 85 pruebas unitarias (Vitest, no tocan la base)
npm run typecheck    # next typegen + tsc
npm run lint
npm run build

npm run test:db      # 37 + 114 pruebas contra la base REAL (reglas, permisos, flujos del panel; crea y borra datos y usuarios de prueba)
npm run test:pages   # humo HTTP del panel con sesión (requiere npm run dev en otra terminal)
npm run admin:create # crea o promueve el usuario administrador (pide correo y contraseña)
npm run db:seed-media # sube las fotos de ejemplo y las asigna donde no haya foto
npm run db:status    # ¿faltan migraciones por aplicar? (simulación)
npm run db:push      # aplica migraciones nuevas de supabase/migrations
npm run db:seed      # migraciones + supabase/seed.sql (datos de ejemplo)
npm run db:types     # regenera src/types/database.ts tras cambiar el esquema
```

La base remota **ya tiene** las 8 migraciones aplicadas y los datos de ejemplo; en un equipo nuevo no hay que volver a correrlas. Para comprobarlo: `npm run db:status` debe decir *Remote database is up to date*.

Antes de dar algo por terminado: `npm run typecheck && npm run lint && npm test && npm run build`.

## 5. Cómo se conecta la base de datos

- El host directo `db.<ref>.supabase.co` es **solo IPv6** y falla en muchas redes (en el equipo original no resolvía). Por eso `scripts/db.mjs` usa el *session pooler*: `postgres.<ref>@aws-0-us-east-1.pooler.supabase.com:5432`.
- Nuevas migraciones: crea `supabase/migrations/<AAAAMMDDHHMMSS>_nombre.sql`, corre `npm run db:push`, luego `npm run db:types` y haz commit de ambos.
- Nunca se edita una migración ya aplicada: se agrega otra.

## 6. Cómo se trabaja (acuerdos)

- Se trabaja directo en `main`.
- **Una fase = un commit + un tag anotado**: `v0.5.0` (Fase 5), `v0.6.0` (Fase 6) y `v1.0.0` para producción. Se suben juntos: `git push origin main v0.X.0`.
- Mensajes de commit en español, formato `feat: Fase N - …`, con el pie
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` cuando lo escribe Claude Code.
- Antes de subir, verificar que `git status` no incluya ningún `.env`.
- Los textos y datos temporales están marcados (`[EJEMPLO]`, "texto temporal"); no se inventan datos comerciales definitivos.

## 7. Continuar con Claude Code en el equipo nuevo

La memoria de Claude Code **no viaja** entre equipos: todo el contexto está en estos documentos. Abre la carpeta del repo y pide, por ejemplo:

> Lee `README.md`, `docs/00-nuevo-equipo.md` y `docs/05-fases-restantes.md`, verifica que `npm run db:status`, `npm test` y `npm run build` pasen, y empieza la Fase 5.

## 8. Cosas que conviene saber (trampas ya resueltas)

- **Next 16:** `middleware.ts` se llama `proxy.ts`. `AGENTS.md` pide revisar `node_modules/next/dist/docs/` antes de usar APIs nuevas. `cacheComponents` está **desactivado** a propósito.
- **shadcn/ui** usa el estilo `base-nova` sobre `@base-ui/react`: los componentes usan la prop `render`, no `asChild`. `cn` viene del paquete `cn` (`import { cn } from "cn"`), y `src/lib/utils.ts` lo reexporta.
- `lucide-react` v1 ya no trae iconos de marcas: los de redes están en `src/components/shared/social-icons.tsx`.
- `npm run typecheck` ejecuta antes `next typegen` (genera los tipos globales como `LayoutProps`).
- Las páginas públicas usan `createPublicClient()` (sin cookies) para poder ser estáticas con revalidación de 60 s; el panel admin usa el cliente con sesión (`createClient()` de `server.ts`) a través de `requireAdmin()`.
- `@base-ui/react`: `AlertDialogTrigger`/`DropdownMenuTrigger` reciben el botón en `render={<Button … />}`. ESLint (React Compiler) marca `form.watch()`: usa `useWatch({ control, name })`.
- FullCalendar se fijó en la v6 (`6.1.22`, compatible con React 19); la v7 cambia la API. Se carga solo en el navegador (`next/dynamic`, `ssr: false`).
- `createAdminClient()` (clave secreta) solo se usa en el flujo público de reservas y en tareas de mantenimiento. Tiene `server-only`.
- ESLint (`react-hooks`) prohíbe construir JSX dentro de `try/catch` y hacer `setState` síncrono dentro de `useEffect`; ya hay patrones resueltos en `reservar/page.tsx` y `slot-picker.tsx`.
- Lo que `npm test` no cubre (la BD real) lo cubre `npm run test:db`.

## 9. Índice de documentos

| Archivo | Contenido |
|---|---|
| [`02-diseno.md`](02-diseno.md) | Sistema visual, sitio público, panel y componentes |
| [`design/board.html`](design/board.html) | Tablero visual (ábrelo en el navegador) |
| [`03-configuracion.md`](03-configuracion.md) | Stack, decisiones técnicas, esquema y reglas de la base |
| [`04-sitio-publico.md`](04-sitio-publico.md) | Rutas públicas, reserva, contenido administrable |
| [`05-fases-restantes.md`](05-fases-restantes.md) | Plan detallado de las Fases 5 y 6 y datos pendientes del cliente |
| [`06-panel-admin.md`](06-panel-admin.md) | Panel administrativo: primer acceso, rutas, seguridad, imágenes, pruebas |
| [`07-sitio-rediseno.md`](07-sitio-rediseno.md) | Rediseño del sitio público, marca, páginas legales, cookies y analítica |
| [`08-respaldos.md`](08-respaldos.md) | Respaldo semanal cifrado: activarlo y restaurar |
| [`09-manual-administrador.md`](09-manual-administrador.md) | Manual del panel para la barbería |
