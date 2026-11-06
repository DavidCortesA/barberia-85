# Rediseño del sitio público · 85 BARBERÍA

Rediseño editorial de la portada con motion, páginas legales y de soporte, cookies y analítica. Todo texto y foto nuevo sigue siendo editable desde **Panel → Contenido**.

## Portada (`/`)

| Sección | Qué hace | Editable en |
|---|---|---|
| Pantalla de carga | El logo vectorial se dibuja (contorno → relleno) y la cortina sube. CSS puro: no espera a React y se retira sola aunque falle el JS. Una vez por sesión; se omite con "reducir movimiento" | — |
| Hero | Titular enorme y desalineado, foto con paralaje, sello giratorio con texto circular. El h1 no se anima (es el LCP) | Portada |
| Marquesina | Banda ámbar con los nombres reales de los servicios e íconos | Servicios (panel) |
| Servicios | Lista editorial: número, nombre grande, precio; al pasar el cursor barrido de fondo y la foto del servicio sigue al cursor | Servicios (panel) |
| Cómo reservar | 4 pasos con ícono y **foto de fondo opcional** (blanco y negro, difuminado negro de derecha a izquierda; al pasar el cursor, color y zoom). En escritorio, recorrido horizontal ligado al scroll | Contenido → Cómo reservar |
| Nosotros | Texto y foto | Contenido → Nosotros |
| Galería | Mosaico en blanco y negro que pasa a color al pasar el cursor, visor ampliado | Contenido → Galería |
| Llamado final | Titular que sube palabra por palabra y botón "magnético" | Contenido → Llamado final |
| Contacto | Dirección, horarios, WhatsApp, redes | Configuración |

Jerarquía: un solo **h1** (hero); **h2** por sección; **h3** en servicios, pasos y tarjetas de contacto.

## Marca e íconos

- **Logo**: `public/brand/85-barberia-vector.svg` (vectorizado por el cliente). `src/components/brand/logo-paths.ts` se generó desde ese archivo; si el logo cambia, hay que regenerarlo. `LogoMark` lo usa en encabezado, pie, login, panel e intro.
- **Íconos**: PNG de `public/icons` pintados como **máscara CSS** (`BrandIcon`), así toman el color del texto. `RevealIcon` los revela al entrar en pantalla. Para agregar uno: copiar el PNG (con transparencia) y sumarlo a `brandIconFiles`.
- **Favicon** `src/app/icon.svg`, ícono de iOS `apple-icon.tsx`, `manifest.ts`.
- **Imágenes Open Graph** por página (`opengraph-image.tsx` en `/`, `/servicios`, `/reservar`, `/contacto`), generadas con `src/lib/og.tsx`.

## Fotos de ejemplo

`supabase/seed-media/` trae 14 fotos de **Unsplash** (licencia libre, también comercial; fuentes en `manifest.json`). `npm run db:seed-media` las sube al bucket y las asigna a portada, "Nosotros", pasos y galería **solo donde no haya foto**. Después se cambian o quitan desde el panel. Lo ideal es reemplazarlas por fotos reales de la barbería.

## Páginas nuevas

| Ruta | Contenido |
|---|---|
| `/privacidad` | Aviso de privacidad (LFPDPPP): responsable, datos, finalidades, encargados (Supabase, Vercel, WhatsApp), cookies, derechos ARCO |
| `/terminos` | Términos de uso y de la reserva |
| `/gracias` | Después de reservar. Recibe solo servicio, fecha y hora en la URL (nunca nombre ni teléfono). `noindex` |
| 404 | Página propia: unas tijeras "cortan" el 404 |

**Revisar con un asesor legal** los textos de privacidad y términos antes del lanzamiento; usan los datos de **Configuración** (si falta dirección o teléfono, no aparecen).

## Cookies y analítica

- Banner con "Aceptar" / "Solo necesarias"; se reabre desde "Preferencias de cookies" en el pie.
- Solo con consentimiento se cargan **Vercel Web Analytics** (sin cookies; activarlo en el panel de Vercel) y **Google Analytics 4** si se define `NEXT_PUBLIC_GA_ID` (IP anonimizada). La CSP solo admite los dominios de Google si hay ID.

## Accesibilidad y movimiento

- `MotionConfig reducedMotion="user"` en el sitio público: con "reducir movimiento" no hay desplazamientos, solo fundidos, y sin intro.
- Ningún componente cambia su estado inicial según esa preferencia (el servidor no la conoce y rompía la hidratación).
- Texto alternativo: fotos de portada y "Nosotros" editables; galería con alt por foto; las fotos de los pasos usan el título del paso.

## Lighthouse (móvil, build de producción en local)

SEO 100 · Accesibilidad 100 · Buenas prácticas 100 en todas las páginas. **Rendimiento ~55–70**: el motion (intro, paralaje, recorrido horizontal) cuesta tiempo de JavaScript en la emulación de móvil lento. Las mediciones en esta máquina variaron mucho por carga; medir de nuevo ya desplegado en Vercel antes de decidir recortes (p. ej. quitar el recorrido horizontal en móvil o la intro).
