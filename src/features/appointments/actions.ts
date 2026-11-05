"use server";

import { shopLocalToUtc } from "@/lib/date";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeMxPhone, toE164Mx } from "@/lib/whatsapp";
import { bookingErrorMessages, toBookingErrorCode, type BookingErrorCode } from "./errors";
import { bookingSchema } from "./schemas";

export type BookingResult =
  | { ok: true; startsAt: string; endsAt: string }
  | {
      ok: false;
      code: BookingErrorCode;
      message: string;
      fieldErrors?: Partial<Record<"fullName" | "phone" | "notes", string>>;
    };

const fail = (code: BookingErrorCode, extra?: { fieldErrors?: Record<string, string> }): BookingResult => ({
  ok: false,
  code,
  message: bookingErrorMessages[code],
  ...extra,
});

/**
 * Registra una solicitud de cita (estado `pending`). Toda la validación se
 * repite aquí y otra vez dentro de la función SQL, bajo bloqueo, para que dos
 * clientes simultáneos no puedan quedarse con el mismo horario.
 */
export async function createAppointmentRequestAction(input: unknown): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (["fullName", "phone", "notes"].includes(field) && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return fail("validation", { fieldErrors });
  }

  const data = parsed.data;

  // Honeypot: un bot rellenó el campo oculto. Se responde "éxito" sin tocar la BD.
  if (data.website) {
    const startsAt = shopLocalToUtc(data.date, data.time);
    return { ok: true, startsAt: startsAt.toISOString(), endsAt: startsAt.toISOString() };
  }

  const phone = normalizeMxPhone(data.phone);
  if (!phone) return fail("validation", { fieldErrors: { phone: "Escribe un teléfono de 10 dígitos" } });

  const startsAt = shopLocalToUtc(data.date, data.time);

  const { data: appointment, error } = await createAdminClient().rpc("create_appointment_request", {
    p_service_id: data.serviceId,
    p_starts_at: startsAt.toISOString(),
    p_full_name: data.fullName.replace(/\s+/g, " "),
    p_phone: toE164Mx(phone),
    p_notes: data.notes || undefined,
  });

  if (error) {
    const code = toBookingErrorCode(error.message);
    // Solo se registra el código; nunca nombre ni teléfono del cliente.
    if (code === "unknown") console.error("[booking] error inesperado", error.code, error.message);
    return fail(code);
  }

  return { ok: true, startsAt: appointment.starts_at, endsAt: appointment.ends_at };
}
