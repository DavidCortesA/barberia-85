import type { AppointmentStatus } from "@/types";

/** Cita lista para mostrarse en el panel (serializable, se pasa a Client Components). */
export type AppointmentView = {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  date: string;
  price: number;
  durationMinutes: number;
  customerName: string;
  /** E.164: +52XXXXXXXXXX */
  customerPhone: string;
  customerNotes: string | null;
  adminNotes: string | null;
  serviceName: string;
  barberName: string | null;
  createdAt: string;
  events: { id: string; from: AppointmentStatus | null; to: AppointmentStatus; at: string; bySystem: boolean }[];
};

/** Columnas que se piden a Supabase para construir un AppointmentView. */
export const APPOINTMENT_SELECT = `
  id, status, starts_at, ends_at, appointment_date, price_snapshot, duration_snapshot,
  customer_notes, admin_notes, created_at,
  customer:customers!inner(full_name, phone),
  service:services(name),
  barber:barbers(name),
  events:appointment_events(id, from_status, to_status, created_at, actor)
` as const;

type Row = {
  id: string;
  status: AppointmentStatus;
  starts_at: string;
  ends_at: string;
  appointment_date: string;
  price_snapshot: number;
  duration_snapshot: number;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  customer: { full_name: string; phone: string } | null;
  service: { name: string } | null;
  barber: { name: string } | null;
  events: { id: string; from_status: AppointmentStatus | null; to_status: AppointmentStatus; created_at: string; actor: string | null }[] | null;
};

export function toAppointmentView(row: Row): AppointmentView {
  return {
    id: row.id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    date: row.appointment_date,
    price: Number(row.price_snapshot),
    durationMinutes: row.duration_snapshot,
    customerName: row.customer?.full_name ?? "—",
    customerPhone: row.customer?.phone ?? "",
    customerNotes: row.customer_notes,
    adminNotes: row.admin_notes,
    serviceName: row.service?.name ?? "—",
    barberName: row.barber?.name ?? null,
    createdAt: row.created_at,
    events: (row.events ?? [])
      .map((e) => ({ id: e.id, from: e.from_status, to: e.to_status, at: e.created_at, bySystem: e.actor === null }))
      .sort((a, b) => a.at.localeCompare(b.at)),
  };
}

/** "+528112345678" → "8112345678" (para wa.me y para mostrar). */
export function phoneTenDigits(e164: string): string {
  return e164.replace(/^\+52/, "");
}
