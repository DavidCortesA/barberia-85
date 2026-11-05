/** Códigos que lanza create_appointment_request() y su mensaje para el cliente. */
export const bookingErrorMessages = {
  slot_unavailable: "Ese horario ya no está disponible. Elige otro, por favor.",
  too_many_pending:
    "Ya tienes solicitudes pendientes con este teléfono. Espera a que las confirmemos o escríbenos por WhatsApp.",
  too_soon: "Ese horario ya no admite reservas por falta de anticipación. Elige uno más adelante.",
  too_far: "Aún no abrimos la agenda para esa fecha. Elige una más cercana.",
  outside_business_hours: "Ese horario está fuera del horario de atención.",
  bad_slot_alignment: "Ese horario no es válido. Elige uno de la lista.",
  service_not_found: "Ese servicio ya no está disponible. Elige otro.",
  invalid_input: "Revisa tus datos e inténtalo de nuevo.",
  validation: "Revisa los datos marcados e inténtalo de nuevo.",
  unknown: "No pudimos registrar tu solicitud. Inténtalo de nuevo en unos minutos.",
} as const;

export type BookingErrorCode = keyof typeof bookingErrorMessages;

export function toBookingErrorCode(message: string | undefined): BookingErrorCode {
  const code = (message ?? "").trim();
  return code in bookingErrorMessages ? (code as BookingErrorCode) : "unknown";
}

/** Errores tras los que conviene volver a elegir el horario. */
export const slotRelatedErrors: readonly BookingErrorCode[] = [
  "slot_unavailable",
  "too_soon",
  "too_far",
  "outside_business_hours",
  "bad_slot_alignment",
];
