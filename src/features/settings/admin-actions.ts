"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { requireAdmin } from "@/features/auth/dal";
import { normalizeMxPhone } from "@/lib/whatsapp";
import { settingsSchema } from "./schemas";

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const v = parsed.data;

  const { error } = await supabase
    .from("business_settings")
    .update({
      name: v.name,
      address: v.address || null,
      city: v.city || null,
      phone: v.phone ? normalizeMxPhone(v.phone) : null,
      whatsapp: v.whatsapp ? normalizeMxPhone(v.whatsapp) : null,
      maps_url: v.mapsUrl || null,
      instagram: v.instagram || null,
      facebook: v.facebook || null,
      tiktok: v.tiktok || null,
      slot_interval_minutes: v.slotIntervalMinutes,
      min_notice_minutes: v.minNoticeMinutes,
      max_advance_days: v.maxAdvanceDays,
      pending_hold_minutes: v.pendingHoldMinutes,
      max_pending_per_phone: v.maxPendingPerPhone,
    })
    .eq("id", true)
    .select("id")
    .single();
  if (error) return failure(dbErrorMessage(error));

  revalidatePath("/", "layout");
  return { ok: true, message: "Configuración guardada." };
}
