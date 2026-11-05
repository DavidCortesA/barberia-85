import "server-only";
import { cache } from "react";
import { siteConfig } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";
import type { BusinessHour, BusinessSettings } from "@/types";

/** Valores de respaldo si la BD no responde (coinciden con los defaults de la tabla). */
const fallbackSettings: BusinessSettings = {
  id: true,
  name: siteConfig.name,
  address: siteConfig.contact.address,
  city: siteConfig.contact.city,
  phone: siteConfig.contact.phone,
  whatsapp: siteConfig.contact.whatsapp,
  instagram: siteConfig.socials.instagram,
  facebook: siteConfig.socials.facebook,
  tiktok: siteConfig.socials.tiktok,
  maps_url: siteConfig.contact.mapsUrl,
  timezone: siteConfig.timeZone,
  slot_interval_minutes: siteConfig.booking.slotIntervalMinutes,
  min_notice_minutes: siteConfig.booking.minNoticeMinutes,
  max_advance_days: siteConfig.booking.maxAdvanceDays,
  pending_hold_minutes: siteConfig.booking.pendingHoldMinutes,
  max_pending_per_phone: siteConfig.booking.maxPendingPerPhone,
  updated_at: new Date(0).toISOString(),
};

export const getBusinessSettings = cache(async (): Promise<BusinessSettings> => {
  try {
    const { data, error } = await createPublicClient()
      .from("business_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? fallbackSettings;
  } catch (err) {
    console.error("[settings] No se pudo leer business_settings; se usan valores por defecto.", err);
    return fallbackSettings;
  }
});

/** Horario semanal (público). Si falla, devuelve [] y la UI muestra "consultar horario". */
export const getBusinessHours = cache(async (): Promise<BusinessHour[]> => {
  try {
    const { data, error } = await createPublicClient()
      .from("business_hours")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("opening_time", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error("[settings] No se pudo leer business_hours.", err);
    return [];
  }
});
