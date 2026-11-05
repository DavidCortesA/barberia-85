/**
 * Configuración central del sitio.
 *
 * IMPORTANTE: los datos marcados con `placeholder: true` son TEMPORALES.
 * La fuente de verdad en producción es la tabla `business_settings` (editable
 * desde /admin/settings); este archivo solo aporta valores por defecto y
 * textos de interfaz. No inventar datos comerciales definitivos aquí.
 */

export const siteConfig = {
  name: "85 BARBERÍA",
  shortName: "85",
  tagline: "El corte que te define",
  description:
    "85 BARBERÍA: cortes y barba con precisión. Consulta servicios, revisa horarios y solicita tu cita en línea.",
  locale: "es-MX",
  timeZone: "America/Monterrey",
  country: "MX",

  nav: [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/#servicios" },
    { label: "Nosotros", href: "/#nosotros" },
    { label: "Contacto", href: "/#contacto" },
  ],

  /** Datos de contacto por defecto. `null` = aún no proporcionado por el negocio. */
  contact: {
    placeholder: true,
    address: null as string | null,
    city: null as string | null,
    phone: null as string | null,
    /** 10 dígitos MX, sin lada país. */
    whatsapp: null as string | null,
    mapsUrl: null as string | null,
  },

  socials: {
    placeholder: true,
    instagram: null as string | null,
    facebook: null as string | null,
    tiktok: null as string | null,
  },

  /** Reglas de reserva por defecto (se sobrescriben con business_settings). */
  booking: {
    slotIntervalMinutes: 30,
    minNoticeMinutes: 60,
    maxAdvanceDays: 30,
    pendingHoldMinutes: 180,
    maxPendingPerPhone: 2,
  },
} as const;

export type SiteConfig = typeof siteConfig;
