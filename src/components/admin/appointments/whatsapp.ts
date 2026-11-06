import { formatDateSentence } from "@/features/appointments/format";
import { phoneTenDigits, type AppointmentView } from "@/features/appointments/view";
import { shopDateKey, shopTimeKey } from "@/lib/date";
import { formatTime12 } from "@/lib/format";
import { buildWhatsAppLink, confirmationMessage } from "@/lib/whatsapp";

/**
 * Enlace wa.me para escribirle al cliente. Si la cita está confirmada lleva el
 * mensaje de confirmación acordado; si no, un saludo con la fecha solicitada.
 */
export function whatsappLinkFor(appt: AppointmentView): string | null {
  const phone = phoneTenDigits(appt.customerPhone);
  if (!/^\d{10}$/.test(phone)) return null;
  const name = appt.customerName.split(" ")[0] ?? appt.customerName;
  const dateText = formatDateSentence(shopDateKey(appt.startsAt));
  const timeText = formatTime12(shopTimeKey(appt.startsAt));
  if (appt.status === "confirmed") {
    return buildWhatsAppLink(phone, confirmationMessage({ name, dateText, timeText }));
  }
  return buildWhatsAppLink(
    phone,
    `Hola, ${name}. Te escribimos de 85 BARBERÍA sobre tu solicitud de cita del ${dateText} a las ${timeText.replace(/\.$/, "")}.`,
  );
}
