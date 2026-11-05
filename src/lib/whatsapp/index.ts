/**
 * Utilidades de WhatsApp. En el MVP NO se envían mensajes automáticos:
 * solo se generan enlaces wa.me que el admin abre manualmente.
 */

/** Normaliza un teléfono mexicano a 10 dígitos. Devuelve null si es inválido. */
export function normalizeMxPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  // Quita lada país (52) y el antiguo prefijo móvil (521).
  if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  return digits.length === 10 ? digits : null;
}

/** Formato E.164 para México: +52XXXXXXXXXX. */
export function toE164Mx(tenDigits: string): string {
  return `+52${tenDigits}`;
}

/** Enlace wa.me (sin "+", solo dígitos) con texto precodificado. */
export function buildWhatsAppLink(tenDigits: string, message?: string): string {
  const base = `https://wa.me/52${tenDigits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Mensaje de confirmación para el cliente (texto acordado con el negocio). */
export function confirmationMessage(params: {
  name: string;
  dateText: string;
  timeText: string;
}): string {
  return `Hola, ${params.name}. Tu cita en 85 BARBERÍA ha sido confirmada para el día ${params.dateText} a las ${params.timeText}. ¡Te esperamos!`;
}
