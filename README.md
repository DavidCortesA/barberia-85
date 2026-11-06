# 85 BARBERÍA

Sitio web público y sistema de reservaciones para **85 BARBERÍA** (México, zona horaria `America/Monterrey`). Las citas se solicitan en línea y las confirma el administrador manualmente; no hay pagos en esta versión.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS 4 · shadcn/ui · Motion · Supabase (PostgreSQL, Auth, Storage) · React Hook Form + Zod · date-fns · Vitest · Vercel.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Análisis y planificación | ✅ `v0.1.0` |
| 2 | Diseño (sistema visual, tablero, logo) | ✅ `v0.2.0` |
| 3 | Configuración (Next, Supabase, migraciones, RLS) | ✅ `v0.3.0` |
| 4 | Sitio público y reservaciones | ✅ `v0.4.0` |
| 5 | Panel administrativo (incluye editor de contenido) | ✅ `v0.5.0` |
| 6 | Pruebas, seguridad y despliegue en Vercel | ⏳ pendiente |

## Empezar

```bash
npm install
cp .env.example .env.local   # rellena las claves (ver docs/00-nuevo-equipo.md)
npm run dev                  # http://localhost:3000
npm run admin:create         # crea el usuario administrador (una vez) → /login
```

Verificación completa: `npm run typecheck && npm run lint && npm test && npm run build`.

## Documentación

- [`docs/00-nuevo-equipo.md`](docs/00-nuevo-equipo.md): cómo retomar el proyecto en otro equipo, variables, comandos y acuerdos de trabajo
- [`docs/05-fases-restantes.md`](docs/05-fases-restantes.md): **qué sigue** (Fases 5 y 6) y datos pendientes del cliente
- [`docs/06-panel-admin.md`](docs/06-panel-admin.md): panel administrativo (primer acceso, rutas, seguridad, imágenes)
- [`docs/02-diseno.md`](docs/02-diseno.md) · [`docs/03-configuracion.md`](docs/03-configuracion.md) · [`docs/04-sitio-publico.md`](docs/04-sitio-publico.md)
- Tablero visual: [`docs/design/board.html`](docs/design/board.html)

## Seguridad

`.env.local` nunca se sube a git. La clave `SUPABASE_SECRET_KEY` solo se usa en el servidor. Toda tabla tiene RLS; el rol de administrador vive en `public.profiles`.
