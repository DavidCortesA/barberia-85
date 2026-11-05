/** Convierte lo que el admin capture ("@usuario" o URL completa) en una URL de red social. */
export function socialUrl(kind: "instagram" | "facebook" | "tiktok", value: string | null): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  switch (kind) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
  }
}

/** Enlace a Google Maps: el configurado o una búsqueda por dirección. */
export function mapsUrl(settings: { maps_url: string | null; address: string | null; city: string | null }): string | null {
  if (settings.maps_url?.trim()) return settings.maps_url.trim();
  const query = [settings.address, settings.city].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

/** "81 1234 5678" para mostrar un teléfono de 10 dígitos. */
export function formatPhoneDisplay(value: string): string {
  const d = value.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}` : value;
}
