import type { AppointmentStatus } from "@/types";

/** Estado que se muestra: los 6 de la BD + "vencida" (pendiente cuya hora ya pasó). */
export type DisplayStatus = AppointmentStatus | "overdue";

export const statusLabels: Record<DisplayStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  completed: "Completada",
  expired: "Vencida",
  overdue: "Vencida",
};

/** Color de cada estado (mismos valores que los tokens st-* de globals.css). */
export const statusColors: Record<DisplayStatus, string> = {
  pending: "#e6d94a",
  confirmed: "#3fb950",
  rejected: "#f0524f",
  cancelled: "#71717a",
  completed: "#4c9aff",
  expired: "#52525b",
  overdue: "#52525b",
};

export const allStatuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "rejected", "cancelled", "expired"];

export function displayStatus(status: AppointmentStatus, startsAt: string, now: number = Date.now()): DisplayStatus {
  return status === "pending" && new Date(startsAt).getTime() < now ? "overdue" : status;
}

/** Transiciones que puede hacer el admin (la BD las vuelve a validar en el trigger). */
export type AdminTransition = "confirmed" | "rejected" | "cancelled" | "completed";

export function allowedTransitions(status: AppointmentStatus, startsAt: string, now: number = Date.now()): AdminTransition[] {
  const started = new Date(startsAt).getTime() <= now;
  if (status === "pending") return started ? ["rejected", "cancelled"] : ["confirmed", "rejected", "cancelled"];
  if (status === "confirmed") return started ? ["completed", "cancelled"] : ["cancelled"];
  return [];
}

export const transitionCopy: Record<
  AdminTransition,
  { verb: string; title: string; description: string; done: string; destructive: boolean }
> = {
  confirmed: {
    verb: "Confirmar",
    title: "¿Confirmar esta cita?",
    description: "El horario quedará reservado. Después podrás avisar al cliente por WhatsApp.",
    done: "Cita confirmada.",
    destructive: false,
  },
  rejected: {
    verb: "Rechazar",
    title: "¿Rechazar esta solicitud?",
    description: "El horario se liberará. El cliente no recibe aviso automático.",
    done: "Solicitud rechazada.",
    destructive: true,
  },
  cancelled: {
    verb: "Cancelar",
    title: "¿Cancelar esta cita?",
    description: "El horario se liberará. Esta acción no se puede deshacer.",
    done: "Cita cancelada.",
    destructive: true,
  },
  completed: {
    verb: "Completar",
    title: "¿Marcar como completada?",
    description: "Indica que el servicio ya se realizó.",
    done: "Cita completada.",
    destructive: false,
  },
};
