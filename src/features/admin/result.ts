import type { ZodError } from "zod";

/** Resultado uniforme de las Server Actions del panel: se muestra con un toast. */
export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T; /** Éxito con advertencia (toast amarillo). */ warning?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function failure(message: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, message, ...(fieldErrors ? { fieldErrors } : {}) };
}

/** Primer mensaje de error por campo (la ruta se aplana con "."), para RHF. */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function validationFailure(error: ZodError) {
  const fieldErrors = zodFieldErrors(error);
  const first = Object.values(fieldErrors)[0] ?? error.issues[0]?.message;
  return failure(first ? `Revisa los datos: ${first}` : "Revisa los datos marcados.", fieldErrors);
}

type DbError = { code?: string; message?: string } | null | undefined;

/**
 * Traduce los errores de Postgres/PostgREST a mensajes comprensibles.
 * `overrides` permite un mensaje específico por código para cada pantalla.
 */
export function dbErrorMessage(error: DbError, overrides: Record<string, string> = {}): string {
  const code = error?.code ?? "";
  const raw = (error?.message ?? "").trim();
  if (overrides[code]) return overrides[code];
  if (overrides[raw]) return overrides[raw];

  switch (raw) {
    case "slot_blocked":
      return "Hay un bloqueo de agenda en ese horario.";
    case "invalid_status_transition":
      return "La cita ya cambió de estado. Recarga para ver su estado actual.";
    case "too_early_to_complete":
      return "Solo puedes marcar como completada una cita cuya hora ya empezó.";
    case "immutable_fields":
      return "No se pueden cambiar el cliente, el servicio ni el precio de una cita.";
    case "outside_business_hours":
      return "Ese horario está fuera del horario de atención.";
    case "forbidden":
      return "No tienes permiso para hacer esto.";
  }

  switch (code) {
    case "23P01":
      return "Ese horario se traslapa con otro registro.";
    case "23503":
      return "No se puede eliminar porque otros registros dependen de él.";
    case "23505":
      return "Ya existe un registro con esos datos.";
    case "23514":
      return "Algún dato no cumple las reglas (revisa formatos y rangos).";
    case "42501":
      return "No tienes permiso para hacer esto.";
    case "PGRST116":
      return "El registro ya no existe. Recarga la página.";
  }

  console.error("[admin] error inesperado de BD", code, raw);
  return "No se pudo guardar. Inténtalo de nuevo.";
}
