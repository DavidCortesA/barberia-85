/**
 * Registro del contenido administrable del sitio público.
 *
 * Es la ÚNICA lista de campos editables: el sitio lee sus valores (tabla
 * `site_content`, con estos textos como respaldo) y el panel /admin/content
 * genera su formulario a partir de aquí. Para volver editable un texto nuevo,
 * basta con agregarlo a `contentFields`.
 *
 * Los textos marcados "temporal" son marcadores de posición, no contenido real.
 */

export type ContentFieldType = "text" | "textarea" | "image";

export type ContentField = {
  key: string;
  section: string;
  label: string;
  type: ContentFieldType;
  /** Valor por defecto. Para imágenes, "" significa "sin imagen". */
  default: string;
  hint?: string;
  maxLength?: number;
};

export const contentSections = [
  { id: "hero", label: "Portada", description: "Lo primero que ve el visitante." },
  { id: "services", label: "Servicios", description: "Encabezado de la sección de servicios." },
  { id: "process", label: "Cómo reservar", description: "Los pasos para reservar, con íconos." },
  { id: "about", label: "Nosotros", description: "Presentación de la barbería." },
  { id: "gallery", label: "Galería", description: "Encabezado. Las fotos se administran aparte." },
  { id: "contact", label: "Contacto", description: "Encabezado de la sección de contacto." },
  { id: "cta", label: "Llamado final", description: "Bloque grande antes del contacto que invita a reservar." },
  { id: "booking", label: "Reservaciones", description: "Textos del flujo de reserva." },
  { id: "seo", label: "Buscadores (SEO)", description: "Título y descripción en Google." },
] as const;

export const contentFields = [
  // Portada
  { key: "hero.eyebrow", section: "hero", label: "Etiqueta superior", type: "text", default: "Barbería", maxLength: 60 },
  { key: "hero.title_main", section: "hero", label: "Título (parte blanca)", type: "text", default: "El corte que", maxLength: 40 },
  { key: "hero.title_accent", section: "hero", label: "Título (parte destacada en ámbar)", type: "text", default: "te define", maxLength: 40 },
  { key: "hero.tagline", section: "hero", label: "Frase en cursiva", type: "text", default: "Precisión, calma y buena conversación.", maxLength: 100 },
  { key: "hero.description", section: "hero", label: "Descripción", type: "textarea", default: "Solicita tu cita en línea en pocos pasos. La barbería la confirma por WhatsApp.", maxLength: 280 },
  { key: "hero.cta_primary", section: "hero", label: "Botón principal", type: "text", default: "Reservar cita", maxLength: 30 },
  { key: "hero.cta_secondary", section: "hero", label: "Botón secundario", type: "text", default: "Ver servicios", maxLength: 30 },
  { key: "hero.image", section: "hero", label: "Fotografía de portada", type: "image", default: "", hint: "Vertical (4:5), mínimo 1200 px de alto." },
  { key: "hero.image_alt", section: "hero", label: "Descripción de la foto de portada", type: "text", default: "Interior de 85 BARBERÍA", maxLength: 140, hint: "Qué se ve en la foto, para lectores de pantalla y Google." },

  // Servicios
  { key: "services.eyebrow", section: "services", label: "Etiqueta superior", type: "text", default: "Servicios", maxLength: 40 },
  { key: "services.title", section: "services", label: "Título", type: "text", default: "Lo que hacemos", maxLength: 60 },
  { key: "services.subtitle", section: "services", label: "Subtítulo", type: "text", default: "Elige tu servicio y solicita tu horario.", maxLength: 140 },

  // Nosotros
  { key: "about.eyebrow", section: "about", label: "Etiqueta superior", type: "text", default: "Nosotros", maxLength: 40 },
  { key: "about.title", section: "about", label: "Título", type: "text", default: "Oficio y detalle", maxLength: 60 },
  { key: "about.body", section: "about", label: "Texto", type: "textarea", default: "Texto temporal: cuenta aquí la historia, la filosofía y la experiencia de la barbería. Se edita desde el panel de administración.", maxLength: 1500, hint: "Separa los párrafos con una línea en blanco." },
  { key: "about.image", section: "about", label: "Fotografía", type: "image", default: "", hint: "Horizontal (4:3) o vertical; se recorta al centro." },
  { key: "about.image_alt", section: "about", label: "Descripción de la fotografía", type: "text", default: "El equipo de 85 BARBERÍA", maxLength: 140, hint: "Qué se ve en la foto, para lectores de pantalla y Google." },

  // Cómo reservar
  { key: "process.eyebrow", section: "process", label: "Etiqueta superior", type: "text", default: "Cómo reservar", maxLength: 40 },
  { key: "process.title", section: "process", label: "Título", type: "text", default: "Tu cita en cuatro pasos", maxLength: 60 },
  { key: "process.step1_title", section: "process", label: "Paso 1 · título", type: "text", default: "Elige tu servicio", maxLength: 40 },
  { key: "process.step1_text", section: "process", label: "Paso 1 · texto", type: "textarea", default: "Revisa precios y duración, y escoge lo que necesitas.", maxLength: 160 },
  { key: "process.step1_image", section: "process", label: "Paso 1 · foto de fondo", type: "image", default: "", hint: "Opcional. Se muestra en blanco y negro y a color al pasar el cursor. Sin foto, la tarjeta queda lisa." },
  { key: "process.step2_title", section: "process", label: "Paso 2 · título", type: "text", default: "Escoge día y hora", maxLength: 40 },
  { key: "process.step2_text", section: "process", label: "Paso 2 · texto", type: "textarea", default: "Ves en el momento los horarios que siguen libres.", maxLength: 160 },
  { key: "process.step2_image", section: "process", label: "Paso 2 · foto de fondo", type: "image", default: "", hint: "Opcional. Se muestra en blanco y negro y a color al pasar el cursor. Sin foto, la tarjeta queda lisa." },
  { key: "process.step3_title", section: "process", label: "Paso 3 · título", type: "text", default: "Te confirmamos", maxLength: 40 },
  { key: "process.step3_text", section: "process", label: "Paso 3 · texto", type: "textarea", default: "La barbería revisa tu solicitud y te confirma por WhatsApp.", maxLength: 160 },
  { key: "process.step3_image", section: "process", label: "Paso 3 · foto de fondo", type: "image", default: "", hint: "Opcional. Se muestra en blanco y negro y a color al pasar el cursor. Sin foto, la tarjeta queda lisa." },
  { key: "process.step4_title", section: "process", label: "Paso 4 · título", type: "text", default: "Llega y siéntate", maxLength: 40 },
  { key: "process.step4_text", section: "process", label: "Paso 4 · texto", type: "textarea", default: "Te esperamos a la hora acordada. Del resto nos encargamos.", maxLength: 160 },
  { key: "process.step4_image", section: "process", label: "Paso 4 · foto de fondo", type: "image", default: "", hint: "Opcional. Se muestra en blanco y negro y a color al pasar el cursor. Sin foto, la tarjeta queda lisa." },

  // Galería
  { key: "gallery.eyebrow", section: "gallery", label: "Etiqueta superior", type: "text", default: "Galería", maxLength: 40 },
  { key: "gallery.title", section: "gallery", label: "Título", type: "text", default: "Nuestro trabajo", maxLength: 60 },

  // Contacto
  { key: "contact.eyebrow", section: "contact", label: "Etiqueta superior", type: "text", default: "Contacto", maxLength: 40 },
  { key: "contact.title", section: "contact", label: "Título", type: "text", default: "Visítanos", maxLength: 60 },
  { key: "contact.subtitle", section: "contact", label: "Subtítulo", type: "text", default: "Agenda en línea o escríbenos por WhatsApp.", maxLength: 140 },

  // Llamado final
  { key: "cta.eyebrow", section: "cta", label: "Etiqueta superior", type: "text", default: "Tu lugar te espera", maxLength: 40 },
  { key: "cta.title", section: "cta", label: "Título", type: "text", default: "¿Listo para tu próximo corte?", maxLength: 60 },
  { key: "cta.subtitle", section: "cta", label: "Subtítulo", type: "text", default: "Aparta tu horario en menos de un minuto.", maxLength: 120 },

  // Reservaciones
  { key: "booking.title", section: "booking", label: "Título de la página", type: "text", default: "Reserva tu cita", maxLength: 60 },
  { key: "booking.intro", section: "booking", label: "Introducción", type: "textarea", default: "Elige servicio, día y hora. Tu solicitud queda pendiente hasta que la barbería la confirme.", maxLength: 280 },
  { key: "booking.pending_notice", section: "booking", label: "Aviso antes de enviar", type: "text", default: "Es una solicitud: la barbería la confirmará por WhatsApp.", maxLength: 160 },
  { key: "booking.success_title", section: "booking", label: "Título al enviar", type: "text", default: "¡Solicitud enviada!", maxLength: 60 },
  { key: "booking.success_message", section: "booking", label: "Mensaje al enviar", type: "textarea", default: "Te confirmaremos tu cita por WhatsApp lo antes posible.", maxLength: 280 },

  // SEO
  { key: "seo.title", section: "seo", label: "Título del sitio", type: "text", default: "85 BARBERÍA · El corte que te define", maxLength: 70 },
  { key: "seo.description", section: "seo", label: "Descripción del sitio", type: "textarea", default: "85 BARBERÍA: cortes y barba con precisión. Consulta servicios, revisa horarios y solicita tu cita en línea.", maxLength: 170 },
] as const satisfies readonly ContentField[];

export type ContentKey = (typeof contentFields)[number]["key"];
export type SiteContent = Record<ContentKey, string>;

export const contentDefaults = Object.fromEntries(
  contentFields.map((f) => [f.key, f.default]),
) as SiteContent;

const validKeys = new Set<string>(contentFields.map((f) => f.key));

export function isContentKey(key: string): key is ContentKey {
  return validKeys.has(key);
}
