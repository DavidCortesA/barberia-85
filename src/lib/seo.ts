import { publicEnv } from "@/config/env";
import { socialUrl } from "@/lib/links";
import type { BusinessHour, BusinessSettings } from "@/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Datos estructurados (schema.org) para Google. Solo incluye lo que el negocio ya capturó. */
export function buildLocalBusinessJsonLd(settings: BusinessSettings, hours: BusinessHour[]) {
  const sameAs = [
    socialUrl("instagram", settings.instagram),
    socialUrl("facebook", settings.facebook),
    socialUrl("tiktok", settings.tiktok),
  ].filter(Boolean);

  const openingHoursSpecification = hours
    .filter((h) => !h.is_closed && h.opening_time && h.closing_time)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAYS[h.day_of_week],
      opens: h.opening_time!.slice(0, 5),
      closes: h.closing_time!.slice(0, 5),
    }));

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: settings.name,
    url: publicEnv.NEXT_PUBLIC_SITE_URL,
    image: `${publicEnv.NEXT_PUBLIC_SITE_URL}/brand/logo-85-barberia.png`,
    ...(settings.phone ? { telephone: `+52${settings.phone.replace(/\D/g, "")}` } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            ...(settings.city ? { addressLocality: settings.city } : {}),
            addressCountry: "MX",
          },
        }
      : {}),
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** Serializa JSON-LD de forma segura para incrustarlo en <script>. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
