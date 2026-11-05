# Fase 2 — Diseño · 85 BARBERÍA

Tablero visual: [`docs/design/board.html`](design/board.html) (ábrelo en el navegador).
Este documento es la fuente de decisiones; el tablero las muestra renderizadas.

## 1. Decisiones aprobadas

| Tema | Decisión |
|---|---|
| Acento de marca | **Ámbar del logo `#FCA420`** (muestreado del PNG), no el dorado `#C9A45C` |
| Logo | PNG con fondo transparente derivado del original (`public/brand/logo-85-barberia.png`, 590×235). **Pendiente:** versión vectorial/alta resolución para hero y favicon |
| Barberos | Un solo recurso (capacidad 1), sin selector de barbero en el MVP; el modelo ya lo soporta |
| Citas pendientes | Bloquean el horario 3 h (configurable); estado extra `expired` |
| Hosting | Vercel Hobby mientras se prueba. **Recordatorio:** sus términos son de uso no comercial; decidir Pro u otra opción antes del lanzamiento |

## 2. Sistema visual

### Color

| Token | Valor | Uso |
|---|---|---|
| `ink-950` | `#090909` | Fondo base |
| `ink-900` | `#141414` | Superficies (cards, header al hacer scroll) |
| `ink-800` | `#202020` | Superficies elevadas, inputs |
| `ink-700` | `#2C2C2C` | Bordes y divisores |
| `bone` | `#F5F3EF` | Texto principal |
| `mute` | `#A1A1AA` | Texto secundario |
| `amber-500` | `#FCA420` | Acento: CTA, foco, detalles (del logo) |
| `amber-300` | `#FFC766` | Hover, texto destacado sobre fondo oscuro |
| `amber-700` | `#B8730A` | Pressed, bordes de acento |

Estados de cita (siempre **color + icono + texto**, nunca solo color):
pendiente `#E6D94A`, confirmada `#3FB950`, rechazada `#F0524F`, cancelada `#71717A`, completada `#4C9AFF`, vencida `#52525B`.
El amarillo de "pendiente" se parece al ámbar de marca; por eso el chip lleva icono de reloj y en el admin el ámbar de marca se reserva para el botón primario y el foco.

Regla de uso: ~90 % neutros oscuros, el ámbar aparece en un elemento primario por pantalla.

### Tipografía (vía `next/font`, sin dependencias nuevas)

- **Display:** Barlow Condensed 600/700, mayúsculas, tracking amplio. Hace eco de las letras condensadas del logo y soporta acentos (BARBERÍA).
- **Texto/UI:** Manrope 400/500/600.
- **Acento editorial:** Cormorant Garamond *cursiva*, solo para una frase corta por sección.

Escala: hero `clamp(3.5rem, 9vw, 8rem)` · h2 `clamp(2.25rem, 5vw, 4rem)` · h3 `1.5rem` · cuerpo `1rem/1.65` · etiqueta `0.75rem` mayúsculas con tracking.

### Forma, espacio, movimiento

- Radio: 2–4 px en cards y botones (look afilado, de navaja); 999 px solo en chips.
- Bordes de 1 px `rgba(245,243,239,.10)`; sin sombras grandes, la elevación se marca con superficie y borde.
- Espaciado de sección: 96–144 px en escritorio, 64–80 px en móvil. Contenedor 1200 px.
- Movimiento solo con CSS: revelado al hacer scroll (IntersectionObserver de ~20 líneas), header que se compacta, subrayado ámbar en enlaces, `scale(.98)` al presionar. Todo se desactiva con `prefers-reduced-motion`.
- Breakpoints: 640 / 768 / 1024 / 1280. Móvil primero.

### Accesibilidad

Contraste verificado en el tablero (ámbar sobre `ink-950` ≈ 9:1, `mute` sobre `ink-950` ≈ 7.7:1). Foco visible con anillo ámbar de 2 px, objetivos táctiles ≥ 44 px, navegación completa por teclado, `aria-live` en la lista de horarios.

## 3. Sitio público

**Header:** logo a la izquierda; Inicio · Servicios · Nosotros · Contacto; botón "Reservar cita". Transparente sobre el hero; al pasar 40 px de scroll se vuelve `ink-900` con borde inferior y se compacta. Menú móvil a pantalla completa con foco atrapado.

**Hero:** composición editorial en dos columnas. Izquierda: etiqueta, titular condensado enorme, frase en cursiva, dos CTA ("Reservar cita" primario, "Ver servicios" secundario). Derecha: fotografía vertical con marco ámbar desplazado y un "85" en contorno como eco del logo. En móvil, la foto va de fondo con degradado oscuro.

**Servicios:** grilla de 3 columnas (1 en móvil). Cada card: imagen opcional, nombre, descripción, duración, precio y botón "Reservar" que lleva a `/reservar?servicio=<id>`. Estados de carga con skeleton, vacío ("Pronto publicaremos nuestros servicios") y error.

**Nosotros:** texto breve + foto; tres valores. Contenido temporal marcado.

**Galería:** mosaico asimétrico de 6–8 fotos, lightbox accesible. Placeholders hasta recibir fotos reales.

**Contacto:** dirección, horarios (leídos de `business_hours`), botón de WhatsApp, teléfono, redes y enlace a Google Maps (sin iframe de mapa en el MVP, para no cargar scripts de terceros).

**Footer:** logo, navegación, contacto, redes, copyright.

### Flujo de reserva (`/reservar`)

Una sola pantalla con cinco pasos y una barra de progreso fija, pensada para el pulgar:

1. **Servicio** (se salta si llega con `?servicio=`).
2. **Fecha**: calendario mensual; se deshabilitan pasado, días cerrados y fuera de la anticipación máxima.
3. **Horario**: chips de hora, cargados desde `/api/availability`, con estado de carga y vacío ("No hay horarios este día, prueba otro").
4. **Datos**: nombre, teléfono (10 dígitos MX) y notas opcionales; honeypot oculto.
5. **Revisión y envío**: resumen con precio y duración, aviso claro de que es una **solicitud pendiente de confirmación**.

Pantalla de éxito: resumen, texto "Te confirmaremos por WhatsApp", botón a WhatsApp del negocio. Si el horario se ocupó mientras tanto, se vuelve al paso 3 con el mensaje "Ese horario ya no está disponible".

## 4. Panel administrativo

Layout: barra lateral fija de 240 px (colapsable a iconos en tablet; menú inferior en móvil), superficie `ink-900`, contenido sobre `ink-950`. Más denso y funcional que el sitio público; la tipografía display solo en títulos de página.

**Dashboard:** cuatro tarjetas (hoy, pendientes, confirmadas, canceladas), lista "Próximas citas" con acciones rápidas (Confirmar / Rechazar / WhatsApp) y una franja de actividad de los últimos 7 días. Sin gráficas decorativas: solo la franja, porque responde "¿cómo va la semana?".

**Calendario:** FullCalendar con vistas mes/semana/día, filtros por estado como chips, color por estado, bloqueos de agenda como bandas rayadas, horario fuera de atención atenuado. Clic en un evento abre un panel lateral (sheet) con el detalle y las acciones. Los eventos se envían como hora local flotante con `timeZone: 'UTC'`.

**Citas:** tabla con filtros (estado, fecha, búsqueda por nombre o teléfono), paginación, acciones por fila en menú, diálogo de confirmación para rechazar/cancelar. Al confirmar se ofrece abrir WhatsApp con el mensaje prellenado.

**Servicios, Barberos, Horarios, Configuración:** formularios en sheet lateral o página dedicada, con React Hook Form + Zod, subida de imagen con vista previa, interruptor activo/inactivo y confirmación antes de eliminar (se prefiere desactivar).

## 5. Inventario de componentes

| Capa | Componente | Base |
|---|---|---|
| shadcn/ui | Button, Input, Textarea, Label, Select, Switch, Checkbox, Dialog, AlertDialog, Sheet, DropdownMenu, Tabs, Calendar, Popover, Table, Badge, Skeleton, Sonner, Form | `components/ui/` |
| shared | `Logo`, `Container`, `SectionHeading`, `StatusBadge`, `EmptyState`, `ErrorState`, `PriceTag`, `DurationTag`, `WhatsAppButton`, `Reveal` | `components/shared/` |
| public | `SiteHeader`, `MobileNav`, `Hero`, `ServiceCard`, `ServicesGrid`, `AboutSection`, `GalleryGrid`, `ContactBlock`, `SiteFooter`, `BookingWizard` (+ `StepService/Date/Time/Details/Review`), `SlotPicker`, `BookingSuccess` | `components/public/` |
| admin | `AdminSidebar`, `AdminTopbar`, `KpiCard`, `UpcomingList`, `AppointmentsTable`, `AppointmentSheet`, `CalendarView`, `StatusFilterChips`, `ServiceForm`, `BarberForm`, `WeeklyHoursEditor`, `ExceptionsEditor`, `BlockedSlotsEditor`, `SettingsForm`, `ImageUpload` | `components/admin/` |

`StatusBadge` se define una sola vez y se usa en dashboard, tabla, calendario y sheet.

## 6. Pendiente para cerrar el diseño

- Logo vectorial (SVG) y versión cuadrada para favicon.
- Fotografías reales (hero, instalaciones, trabajos). Mientras tanto: placeholders etiquetados.
- Textos reales de "Nosotros", dirección, teléfono, redes y servicios con precios.
