import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Las Server Actions del panel deben rechazar a anónimos y a usuarios sin rol
 * admin ANTES de tocar la base de datos, y validar con Zod antes de escribir.
 * Se simula el cliente de Supabase: cualquier consulta que no sea leer el
 * perfil queda registrada en `writes`.
 */

let role: "anon" | "staff" | "admin" = "anon";
const writes: string[] = [];

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

function builder(table: string) {
  const result =
    table === "profiles"
      ? { data: role === "anon" ? null : { role, full_name: null }, error: null }
      : { data: null, error: null };
  const chain: Record<string, unknown> = {};
  const record = (op: string) => () => {
    if (table !== "profiles") writes.push(`${table}.${op}`);
    return chain;
  };
  for (const op of ["select", "insert", "update", "upsert", "delete", "eq", "neq", "in", "lt", "gt", "order", "limit"]) {
    chain[op] = record(op);
  }
  chain.single = async () => result;
  chain.maybeSingle = async () => result;
  chain.then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({ data: role === "anon" ? null : { claims: { sub: "user-1", email: "a@b.test" } } }),
    },
    from: (table: string) => builder(table),
    rpc: async (fn: string) => {
      writes.push(`rpc.${fn}`);
      return { data: null, error: null };
    },
    storage: {
      from: () => ({
        createSignedUploadUrl: async () => {
          writes.push("storage.upload");
          return { data: null, error: { message: "x" } };
        },
        remove: async () => {
          writes.push("storage.remove");
          return { data: [], error: null };
        },
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  }),
}));

const UUID = "3f1c2a52-8d0e-4a4c-9b57-0a1d2c3e4f5a";

async function loadActions() {
  const [appointments, services, barbers, schedule, settings, content, media] = await Promise.all([
    import("@/features/appointments/admin-actions"),
    import("@/features/services/admin-actions"),
    import("@/features/barbers/admin-actions"),
    import("@/features/schedule/admin-actions"),
    import("@/features/settings/admin-actions"),
    import("@/features/content/admin-actions"),
    import("@/features/media/actions"),
  ]);
  return {
    changeAppointmentStatus: () => appointments.changeAppointmentStatusAction({ id: UUID, to: "confirmed" }),
    rejectAppointments: () => appointments.rejectAppointmentsAction({ ids: [UUID] }),
    saveAdminNotes: () => appointments.saveAdminNotesAction({ id: UUID, notes: "x" }),
    saveService: () => services.saveServiceAction({ name: "Corte", description: "", price: 1, durationMinutes: 30, imageUrl: "", isActive: true }),
    deleteService: () => services.deleteServiceAction({ id: UUID }),
    moveService: () => services.moveServiceAction({ id: UUID, direction: "up" }),
    saveBarber: () => barbers.saveBarberAction({ name: "Juan", specialty: "", description: "", imageUrl: "", isActive: true }),
    saveWeeklyHours: () => schedule.saveWeeklyHoursAction([]),
    createBlock: () => schedule.createBlockAction({}),
    saveSettings: () => settings.saveSettingsAction({}),
    saveContent: () => content.saveContentAction({ section: "hero", values: { "hero.title_main": "Hola" } }),
    deleteGalleryImage: () => content.deleteGalleryImageAction({ id: UUID }),
    createUploadTicket: () => media.createUploadTicketAction({ folder: "content", contentType: "image/png", size: 10 }),
  };
}

beforeEach(() => {
  writes.length = 0;
});

// La primera importación de todas las acciones tarda: se da margen.
describe("Server Actions del panel", { timeout: 60_000 }, () => {
  it("sin sesión: redirigen a /login y no tocan la base", async () => {
    role = "anon";
    const actions = await loadActions();
    for (const [name, run] of Object.entries(actions)) {
      await expect(run(), name).rejects.toThrow("REDIRECT /login");
    }
    expect(writes).toEqual([]);
  });

  it("usuario staff: redirige con aviso de sin acceso y no toca la base", async () => {
    role = "staff";
    const actions = await loadActions();
    for (const [name, run] of Object.entries(actions)) {
      await expect(run(), name).rejects.toThrow("REDIRECT /login?error=sin-acceso");
    }
    expect(writes).toEqual([]);
  });

  it("admin con datos inválidos: Zod los rechaza antes de escribir", async () => {
    role = "admin";
    const { changeAppointmentStatusAction } = await import("@/features/appointments/admin-actions");
    const { saveServiceAction } = await import("@/features/services/admin-actions");
    const { saveWeeklyHoursAction } = await import("@/features/schedule/admin-actions");
    const { saveContentAction } = await import("@/features/content/admin-actions");
    const { createUploadTicketAction } = await import("@/features/media/actions");

    const results = await Promise.all([
      changeAppointmentStatusAction({ id: UUID, to: "pending" }),
      changeAppointmentStatusAction({ id: "no-uuid", to: "confirmed" }),
      saveServiceAction({ name: "", price: -5 }),
      saveServiceAction({ name: "Corte", description: "", price: 1, durationMinutes: 30, imageUrl: "https://evil.com/x.jpg", isActive: true }),
      saveWeeklyHoursAction([{ day: 1, closed: false, ranges: [] }]),
      saveContentAction({ section: "hero", values: { "about.title": "x" } }),
      createUploadTicketAction({ folder: "content", contentType: "image/svg+xml", size: 10 }),
      createUploadTicketAction({ folder: "../etc", contentType: "image/png", size: 10 }),
      createUploadTicketAction({ folder: "content", contentType: "image/png", size: 6 * 1024 * 1024 }),
    ]);
    for (const r of results) expect(r.ok).toBe(false);
    expect(writes.filter((w) => !w.endsWith(".select"))).toEqual([]);
  });
});
