import { z } from "zod";
import { normalizeMxPhone } from "@/lib/whatsapp";

/** Letras (con acentos), espacios y . ' - ; sin dígitos ni símbolos raros. */
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Fecha de calendario real: rechaza "2026-02-31" (JS la desbordaría a marzo). */
function isRealDate(ymd: string): boolean {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export const ymdSchema = z.string().regex(YMD_RE, "Fecha inválida").refine(isRealDate, "Fecha inválida");

export const timeSchema = z.string().regex(HM_RE, "Hora inválida");

/** Datos del cliente (paso 4). Se comparte entre el formulario y el servidor. */
export const detailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre")
    .max(80, "Máximo 80 caracteres")
    .regex(NAME_RE, "Usa solo letras y espacios"),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeMxPhone(v) !== null, "Escribe un teléfono de 10 dígitos"),
  notes: z.string().trim().max(500, "Máximo 500 caracteres"),
});

export type DetailsInput = z.infer<typeof detailsSchema>;

/** Solicitud completa que valida el servidor (nunca se confía en el cliente). */
export const bookingSchema = detailsSchema.extend({
  serviceId: z.uuid("Servicio inválido"),
  date: ymdSchema,
  time: timeSchema,
  /** Honeypot: los usuarios reales lo dejan vacío. */
  website: z.string().max(200).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
