import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Las Server Actions del panel deben rechazar a anónimos y a usuarios sin rol
 * admin ANTES de tocar la base de datos, y validar con Zod antes de escribir.
 * Se simula el cliente de Supabase: cualquier consulta que no sea leer el
 * perfil queda registrada en `writes`.
 */

let role: "anon" | "staff" | "admin" | "cliente" = "anon";
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
      ? { data: role === "anon" ? null : { role: role === "cliente" ? "otro" : role, full_name: null }, error: null }
      : { data: null, error: null };
  const chain: Record<string, unknown> = {};
  const record = (op: string) => () => {
    if (table !== "profiles") writes.push(`${table}.${op}`);
    return chain;
  };
  for (const op of ["select", "insert", "update", "upsert", "delete", "eq", "neq", "in", "lt", "gt", "order", "limit"]) {
    chain[op] = record(op);
  }
  // Como en Supabase real: .single() sin fila devuelve el error PGRST116.
  chain.single = async () => (result.data ? result : { data: null, error: { code: "PGRST116", message: "" } });
  chain.maybeSingle = async () => result;
  chain.then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

const authAdmin = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    authAdmin();
    return { auth: { admin: { createUser: authAdmin, deleteUser: authAdmin, updateUserById: authAdmin } } };
  },
}));

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
  const [appointments, services, barbers, schedule, settings, content, media, users] = await Promise.all([
    import("@/features/appointments/admin-actions"),
    import("@/features/services/admin-actions"),
    import("@/features/barbers/admin-actions"),
    import("@/features/schedule/admin-actions"),
    import("@/features/settings/admin-actions"),
    import("@/features/content/admin-actions"),
    import("@/features/media/actions"),
    import("@/features/users/admin-actions"),
  ]);
  /** Lo que también puede hacer recepción (staff). */
  const panel = {
    changeAppointmentStatus: () => appointments.changeAppointmentStatusAction({ id: UUID, to: "confirmed" }),
    rejectAppointments: () => appointments.rejectAppointmentsAction({ ids: [UUID] }),
    saveAdminNotes: () => appointments.saveAdminNotesAction({ id: UUID, notes: "x" }),
    createBlock: () => schedule.createBlockAction({}),
    deleteBlock: () => schedule.deleteBlockAction({ id: "no-uuid" }),
  };
  /** Solo administración. */
  const adminOnly = {
    saveService: () => services.saveServiceAction({ name: "Corte", description: "", price: 1, durationMinutes: 30, imageUrl: "", isActive: true }),
    deleteService: () => services.deleteServiceAction({ id: UUID }),
    moveService: () => services.moveServiceAction({ id: UUID, direction: "up" }),
    saveBarber: () => barbers.saveBarberAction({ name: "Juan", specialty: "", description: "", imageUrl: "", isActive: true }),
    saveWeeklyHours: () => schedule.saveWeeklyHoursAction([]),
    createException: () => schedule.createExceptionAction({}),
    saveSettings: () => settings.saveSettingsAction({}),
    saveContent: () => content.saveContentAction({ section: "hero", values: { "hero.title_main": "Hola" } }),
    deleteGalleryImage: () => content.deleteGalleryImageAction({ id: UUID }),
    createUploadTicket: () => media.createUploadTicketAction({ folder: "content", contentType: "image/png", size: 10 }),
    createUser: () => users.createUserAction({ fullName: "Ana", email: "ana@x.test", password: "x".repeat(16), role: "staff" }),
    changeRole: () => users.changeRoleAction({ id: UUID, role: "admin" }),
    setPassword: () => users.setPasswordAction({ id: UUID, password: "x".repeat(16) }),
    deleteUser: () => users.deleteUserAction({ id: UUID }),
  };
  return { panel, adminOnly, all: { ...panel, ...adminOnly } };
}

beforeEach(() => {
  writes.length = 0;
  authAdmin.mockClear();
});

// La primera importación de todas las acciones tarda: se da margen.
describe("Server Actions del panel", { timeout: 60_000 }, () => {
  it("sin sesión: redirigen a /login y no tocan la base", async () => {
    role = "anon";
    const { all } = await loadActions();
    for (const [name, run] of Object.entries(all)) {
      await expect(run(), name).rejects.toThrow("REDIRECT /login");
    }
    expect(writes).toEqual([]);
    expect(authAdmin).not.toHaveBeenCalled();
  });

  it("cuenta sin rol de panel: redirige con aviso de sin acceso", async () => {
    role = "cliente";
    const { all } = await loadActions();
    for (const [name, run] of Object.entries(all)) {
      await expect(run(), name).rejects.toThrow("REDIRECT /login?error=sin-acceso");
    }
    expect(writes).toEqual([]);
  });

  it("recepción (staff): las acciones de administración la regresan al inicio sin tocar nada", async () => {
    role = "staff";
    const { adminOnly } = await loadActions();
    for (const [name, run] of Object.entries(adminOnly)) {
      await expect(run(), name).rejects.toThrow("REDIRECT /admin?aviso=sin-permiso");
    }
    expect(writes).toEqual([]);
    expect(authAdmin).not.toHaveBeenCalled();
  });

  it("recepción (staff): sí pasa la autorización de citas y bloqueos (y Zod valida)", async () => {
    role = "staff";
    const { panel } = await loadActions();
    for (const [name, run] of Object.entries(panel)) {
      await expect(run(), name).resolves.toBeTruthy();
    }
    const { createBlock, deleteBlock } = panel;
    expect((await createBlock()).ok).toBe(false);
    expect((await deleteBlock()).ok).toBe(false);
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
