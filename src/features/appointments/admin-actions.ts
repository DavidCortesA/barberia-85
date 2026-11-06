"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { requireAdmin } from "@/features/auth/dal";
import { shopDateKey, shopTimeKey } from "@/lib/date";
import { formatTime12 } from "@/lib/format";
import { buildWhatsAppLink, confirmationMessage } from "@/lib/whatsapp";
import { formatDateSentence } from "./format";
import { transitionCopy } from "./status";
import { phoneTenDigits } from "./view";

const statusSchema = z.object({
  id: z.uuid(),
  to: z.enum(["confirmed", "rejected", "cancelled", "completed"]),
});

export type Overlap = { id: string; customerName: string; startsAt: string };
export type StatusChangeData = { whatsappUrl?: string; overlaps?: Overlap[] };

const statusErrors = {
  // Constraint de exclusión: dos citas CONFIRMADAS no pueden traslaparse.
  "23P01": "Otra cita confirmada ya ocupa ese horario. Cancélala o rechaza esta solicitud.",
  slot_blocked: "Hay un bloqueo de agenda en ese horario. Quita el bloqueo o rechaza la solicitud.",
};

/** Confirmar, rechazar, cancelar o completar una cita. La BD valida la transición. */
export async function changeAppointmentStatusAction(input: unknown): Promise<ActionResult<StatusChangeData>> {
  const { supabase } = await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { id, to } = parsed.data;

  const { data: appt, error } = await supabase
    .from("appointments")
    .update({ status: to })
    .eq("id", id)
    .select("id, starts_at, ends_at, resource_key, customer:customers(full_name, phone)")
    .single();
  if (error) return failure(dbErrorMessage(error, statusErrors));

  revalidatePath("/admin", "layout");

  if (to !== "confirmed") return { ok: true, message: transitionCopy[to].done };

  // WhatsApp: se ofrece el enlace con el mensaje prellenado; nada se envía solo.
  let whatsappUrl: string | undefined;
  if (appt.customer?.phone) {
    whatsappUrl = buildWhatsAppLink(
      phoneTenDigits(appt.customer.phone),
      confirmationMessage({
        name: appt.customer.full_name.split(" ")[0] ?? appt.customer.full_name,
        dateText: formatDateSentence(shopDateKey(appt.starts_at)),
        timeText: formatTime12(shopTimeKey(appt.starts_at)),
      }),
    );
  }

  // Otras solicitudes pendientes que pedían el mismo horario: se ofrece rechazarlas.
  const { data: overlapping } = await supabase
    .from("appointments")
    .select("id, starts_at, customer:customers(full_name)")
    .eq("status", "pending")
    .neq("id", id)
    .eq("resource_key", appt.resource_key ?? "00000000-0000-0000-0000-000000000000")
    .lt("starts_at", appt.ends_at)
    .gt("ends_at", appt.starts_at);

  return {
    ok: true,
    message: transitionCopy.confirmed.done,
    data: {
      whatsappUrl,
      overlaps: (overlapping ?? []).map((o) => ({
        id: o.id,
        customerName: o.customer?.full_name ?? "—",
        startsAt: o.starts_at,
      })),
    },
  };
}

const rejectManySchema = z.object({ ids: z.array(z.uuid()).min(1).max(50) });

/** Rechaza varias solicitudes pendientes (las que se traslapan con una recién confirmada). */
export async function rejectAppointmentsAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = rejectManySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "rejected" })
    .in("id", parsed.data.ids)
    .eq("status", "pending")
    .select("id");
  if (error) return failure(dbErrorMessage(error));

  revalidatePath("/admin", "layout");
  const n = data?.length ?? 0;
  return { ok: true, message: n === 1 ? "Se rechazó 1 solicitud." : `Se rechazaron ${n} solicitudes.` };
}

const notesSchema = z.object({
  id: z.uuid(),
  notes: z.string().trim().max(500, "Máximo 500 caracteres"),
});

export async function saveAdminNotesAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { error } = await supabase
    .from("appointments")
    .update({ admin_notes: parsed.data.notes || null })
    .eq("id", parsed.data.id)
    .select("id")
    .single();
  if (error) return failure(dbErrorMessage(error));

  revalidatePath("/admin", "layout");
  return { ok: true, message: "Notas guardadas." };
}
