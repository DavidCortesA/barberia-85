const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 150 → "$150"; 150.5 → "$150.50". */
export function formatPrice(value: number): string {
  return mxn.format(value);
}

/** 45 → "45 min"; 60 → "1 h"; 75 → "1 h 15 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "13:30" → "1:30 p. m." (formato habitual en México). */
export function formatTime12(hm: string): string {
  const [hh, mm] = hm.split(":").map(Number);
  const suffix = hh >= 12 ? "p. m." : "a. m.";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}
