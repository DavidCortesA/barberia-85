import "@/lib/zod-config";
import { z } from "zod";
import { normalizeMxPhone } from "@/lib/whatsapp";

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

/** Usuario de red social (@usuario) o URL completa. */
const socialSchema = optionalText(200).refine(
  (v) => v === "" || /^@?[\w.\-]{1,60}$/.test(v) || /^https?:\/\/\S+$/i.test(v),
  "Escribe @usuario o una URL completa",
);

export const SLOT_INTERVALS = [10, 15, 20, 30, 45, 60] as const;

export const settingsSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  address: optionalText(200),
  city: optionalText(80),
  phone: optionalText(30).refine((v) => v === "" || normalizeMxPhone(v) !== null, "Teléfono de 10 dígitos"),
  whatsapp: optionalText(30).refine((v) => v === "" || normalizeMxPhone(v) !== null, "WhatsApp de 10 dígitos"),
  mapsUrl: optionalText(500).refine((v) => v === "" || /^https:\/\/\S+$/i.test(v), "Pega el enlace completo (https://…)"),
  instagram: socialSchema,
  facebook: socialSchema,
  tiktok: socialSchema,
  slotIntervalMinutes: z.number().refine((v) => (SLOT_INTERVALS as readonly number[]).includes(v), "Intervalo no válido"),
  minNoticeMinutes: z.number({ error: "Escribe un número" }).int().min(0, "Mínimo 0").max(10080, "Máximo 7 días (10080 min)"),
  maxAdvanceDays: z.number({ error: "Escribe un número" }).int().min(1, "Mínimo 1 día").max(365, "Máximo 365 días"),
  pendingHoldMinutes: z.number({ error: "Escribe un número" }).int().min(0, "Mínimo 0").max(1440, "Máximo 24 h (1440 min)"),
  maxPendingPerPhone: z.number({ error: "Escribe un número" }).int().min(1, "Mínimo 1").max(10, "Máximo 10"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
