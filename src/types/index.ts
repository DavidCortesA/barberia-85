import type { Database } from "@/types/database";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type AppointmentStatus = Enums<"appointment_status">;
export type Service = Tables<"services">;
export type BusinessSettings = Tables<"business_settings">;
export type BusinessHour = Tables<"business_hours">;
export type ScheduleException = Tables<"schedule_exceptions">;
export type GalleryImage = Tables<"gallery_images">;
