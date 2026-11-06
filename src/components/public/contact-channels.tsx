import { formatPhoneDisplay } from "@/lib/links";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { BusinessSettings } from "@/types";

/** Medios de contacto reales del negocio (los que estén capturados en Configuración). */
export function ContactChannels({ settings }: { settings: BusinessSettings }) {
  const items = [
    settings.whatsapp && (
      <li key="wa">
        WhatsApp:{" "}
        <a href={buildWhatsAppLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
          {formatPhoneDisplay(settings.whatsapp)}
        </a>
      </li>
    ),
    settings.phone && (
      <li key="tel">
        Teléfono: <a href={`tel:+52${settings.phone}`}>{formatPhoneDisplay(settings.phone)}</a>
      </li>
    ),
    settings.address && (
      <li key="dir">
        Domicilio: {settings.address}
        {settings.city ? `, ${settings.city}` : ""}
      </li>
    ),
  ].filter(Boolean);

  if (items.length === 0) {
    return <p>Los medios de contacto aparecen en la sección de contacto del sitio.</p>;
  }
  return <ul>{items}</ul>;
}
