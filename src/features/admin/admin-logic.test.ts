import { describe, expect, it } from "vitest";
import { allowedTransitions, displayStatus } from "@/features/appointments/status";
import { safeAdminPath } from "@/features/auth/schemas";
import { contentSaveSchema } from "@/features/content/schemas";
import { imageFileError, mediaPathFromUrl } from "@/features/media/constants";
import { blockSchema, exceptionSchema, weeklySchema, weeklyToRows, type DayInput } from "@/features/schedule/admin-schemas";
import { settingsSchema } from "@/features/settings/schemas";
import { serviceSchema } from "@/features/services/schemas";
import { reorder } from "./reorder";
import { dbErrorMessage } from "./result";

const MEDIA = "https://abc.supabase.co/storage/v1/object/public/media";

describe("reorder", () => {
  const items = [
    { id: "a", sort_order: 10 },
    { id: "b", sort_order: 20 },
    { id: "c", sort_order: 30 },
  ];
  it("sube y baja intercambiando solo lo necesario", () => {
    expect(reorder(items, "b", "up")).toEqual([
      { id: "b", sort_order: 10 },
      { id: "a", sort_order: 20 },
    ]);
    expect(reorder(items, "b", "down")).toEqual([
      { id: "c", sort_order: 20 },
      { id: "b", sort_order: 30 },
    ]);
  });
  it("no hace nada en los extremos o con un id desconocido", () => {
    expect(reorder(items, "a", "up")).toEqual([]);
    expect(reorder(items, "c", "down")).toEqual([]);
    expect(reorder(items, "zzz", "up")).toEqual([]);
  });
  it("normaliza órdenes repetidos o desordenados", () => {
    const messy = [
      { id: "a", sort_order: 0 },
      { id: "b", sort_order: 0 },
    ];
    expect(reorder(messy, "b", "up")).toEqual([
      { id: "b", sort_order: 10 },
      { id: "a", sort_order: 20 },
    ]);
  });
});

describe("estados de cita", () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const past = new Date(Date.now() - 3_600_000).toISOString();
  it("marca como vencida una pendiente cuya hora pasó", () => {
    expect(displayStatus("pending", past)).toBe("overdue");
    expect(displayStatus("pending", future)).toBe("pending");
    expect(displayStatus("confirmed", past)).toBe("confirmed");
  });
  it("ofrece solo transiciones válidas", () => {
    expect(allowedTransitions("pending", future)).toEqual(["confirmed", "rejected", "cancelled"]);
    expect(allowedTransitions("pending", past)).toEqual(["rejected", "cancelled"]);
    expect(allowedTransitions("confirmed", future)).toEqual(["cancelled"]);
    expect(allowedTransitions("confirmed", past)).toEqual(["completed", "cancelled"]);
    for (const s of ["rejected", "cancelled", "completed", "expired"] as const) {
      expect(allowedTransitions(s, past)).toEqual([]);
    }
  });
});

describe("safeAdminPath (evita redirecciones abiertas)", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/appointments", "/admin/appointments"],
    ["/admin/calendar", "/admin/calendar"],
  ])("acepta %s", (input, expected) => expect(safeAdminPath(input)).toBe(expected));
  it.each(["https://evil.com", "//evil.com", "/admin/../x", "/adminx", "/", undefined, 42, "/admin?x=1"])("rechaza %j", (input) => {
    expect(safeAdminPath(input)).toBe("/admin");
  });
});

describe("horario semanal", () => {
  const week = (patch: Partial<Record<number, Partial<DayInput>>> = {}): DayInput[] =>
    [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      closed: day === 0,
      ranges: day === 0 ? [] : [{ open: "10:00", close: "19:00" }],
      ...patch[day],
    }));

  it("acepta una semana normal y varios rangos por día", () => {
    expect(weeklySchema.safeParse(week()).success).toBe(true);
    const lunch = week({ 1: { ranges: [{ open: "10:00", close: "14:00" }, { open: "15:00", close: "19:00" }] } });
    expect(weeklySchema.safeParse(lunch).success).toBe(true);
    const touching = week({ 1: { ranges: [{ open: "10:00", close: "14:00" }, { open: "14:00", close: "19:00" }] } });
    expect(weeklySchema.safeParse(touching).success).toBe(true);
  });
  it("rechaza traslapes, cierre antes de apertura y días abiertos sin horario", () => {
    expect(weeklySchema.safeParse(week({ 2: { ranges: [{ open: "10:00", close: "15:00" }, { open: "14:00", close: "19:00" }] } })).success).toBe(false);
    expect(weeklySchema.safeParse(week({ 3: { ranges: [{ open: "19:00", close: "10:00" }] } })).success).toBe(false);
    expect(weeklySchema.safeParse(week({ 4: { ranges: [] } })).success).toBe(false);
    expect(weeklySchema.safeParse(week().slice(0, 6)).success).toBe(false);
  });
  it("convierte a filas de business_hours", () => {
    const rows = weeklyToRows(week({ 1: { ranges: [{ open: "15:00", close: "19:00" }, { open: "10:00", close: "14:00" }] } }));
    expect(rows.filter((r) => r.day_of_week === 0)).toEqual([{ day_of_week: 0, opening_time: null, closing_time: null, is_closed: true }]);
    expect(rows.filter((r) => r.day_of_week === 1).map((r) => r.opening_time)).toEqual(["10:00", "15:00"]);
    expect(rows).toHaveLength(1 + 2 + 5); // domingo cerrado + lunes con 2 rangos + 5 días
  });
});

describe("excepciones y bloqueos", () => {
  it("excepción: cerrado no exige horas; horario especial sí", () => {
    expect(exceptionSchema.safeParse({ date: "2026-12-25", closed: true, open: "", close: "", note: "Navidad" }).success).toBe(true);
    expect(exceptionSchema.safeParse({ date: "2026-12-24", closed: false, open: "10:00", close: "14:00", note: "" }).success).toBe(true);
    expect(exceptionSchema.safeParse({ date: "2026-12-24", closed: false, open: "14:00", close: "10:00", note: "" }).success).toBe(false);
    expect(exceptionSchema.safeParse({ date: "2026-02-31", closed: true, open: "", close: "", note: "" }).success).toBe(false);
  });
  it("bloqueo: el fin debe ser posterior al inicio (puede cruzar días)", () => {
    const base = { startDate: "2026-11-10", startTime: "14:00", endDate: "2026-11-10", endTime: "15:00", reason: "", barberId: "" };
    expect(blockSchema.safeParse(base).success).toBe(true);
    expect(blockSchema.safeParse({ ...base, endTime: "13:00" }).success).toBe(false);
    expect(blockSchema.safeParse({ ...base, endDate: "2026-11-12", endTime: "09:00" }).success).toBe(true);
    expect(blockSchema.safeParse({ ...base, barberId: "no-uuid" }).success).toBe(false);
  });
});

describe("contenido del sitio", () => {
  it("acepta claves de la sección y respeta el largo máximo", () => {
    expect(contentSaveSchema.safeParse({ section: "hero", values: { "hero.title_main": "Nuevo título" } }).success).toBe(true);
    expect(contentSaveSchema.safeParse({ section: "hero", values: { "hero.title_main": "x".repeat(41) } }).success).toBe(false);
  });
  it("rechaza claves desconocidas o de otra sección", () => {
    expect(contentSaveSchema.safeParse({ section: "hero", values: { "about.title": "x" } }).success).toBe(false);
    expect(contentSaveSchema.safeParse({ section: "hero", values: { "hero.nope": "x" } }).success).toBe(false);
    expect(contentSaveSchema.safeParse({ section: "nope", values: {} }).success).toBe(false);
  });
  it("las imágenes deben venir del bucket propio ('' = restaurar)", () => {
    const ok = `${MEDIA}/content/123e4567-e89b-12d3-a456-426614174000.webp`;
    expect(contentSaveSchema.safeParse({ section: "hero", values: { "hero.image": ok } }).success).toBe(true);
    expect(contentSaveSchema.safeParse({ section: "hero", values: { "hero.image": "" } }).success).toBe(true);
    expect(contentSaveSchema.safeParse({ section: "hero", values: { "hero.image": "https://evil.com/x.jpg" } }).success).toBe(false);
  });
});

describe("imágenes", () => {
  it("valida tipo y tamaño", () => {
    expect(imageFileError({ type: "image/webp", size: 1000 })).toBeNull();
    expect(imageFileError({ type: "image/gif", size: 1000 })).toMatch(/Formato/);
    expect(imageFileError({ type: "image/svg+xml", size: 1000 })).toMatch(/Formato/);
    expect(imageFileError({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toMatch(/5 MB/);
  });
  it("extrae la ruta solo de URLs del bucket con nombre seguro", () => {
    expect(mediaPathFromUrl(`${MEDIA}/services/abc-123.jpg`)).toBe("services/abc-123.jpg");
    expect(mediaPathFromUrl(`${MEDIA}/services/../../secret.jpg`)).toBeNull();
    expect(mediaPathFromUrl(`${MEDIA}/otra/abc.jpg`)).toBeNull();
    expect(mediaPathFromUrl("https://example.com/x.jpg")).toBeNull();
    expect(mediaPathFromUrl(null)).toBeNull();
  });
});

describe("formularios del panel", () => {
  it("servicio: precio y duración válidos", () => {
    const base = { name: "Corte", description: "", price: 150, durationMinutes: 45, imageUrl: "", isActive: true };
    expect(serviceSchema.safeParse(base).success).toBe(true);
    expect(serviceSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...base, durationMinutes: 47 }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...base, durationMinutes: Number.NaN }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...base, name: "x" }).success).toBe(false);
  });
  it("configuración: WhatsApp de 10 dígitos y redes como @usuario o URL", () => {
    const base = {
      name: "85 BARBERÍA", address: "", city: "", phone: "", whatsapp: "81 1234 5678", mapsUrl: "",
      instagram: "@85barberia", facebook: "https://facebook.com/85", tiktok: "",
      slotIntervalMinutes: 30, minNoticeMinutes: 60, maxAdvanceDays: 30, pendingHoldMinutes: 180, maxPendingPerPhone: 2,
    };
    expect(settingsSchema.safeParse(base).success).toBe(true);
    expect(settingsSchema.safeParse({ ...base, whatsapp: "123" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, instagram: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, mapsUrl: "http://maps" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, slotIntervalMinutes: 25 }).success).toBe(false);
  });
});

describe("dbErrorMessage", () => {
  it("traduce los errores esperados del panel", () => {
    expect(dbErrorMessage({ code: "23P01" }, { "23P01": "ocupado" })).toBe("ocupado");
    expect(dbErrorMessage({ code: "P0001", message: "slot_blocked" })).toMatch(/bloqueo/);
    expect(dbErrorMessage({ code: "P0001", message: "invalid_status_transition" })).toMatch(/cambió de estado/);
    expect(dbErrorMessage({ code: "P0001", message: "too_early_to_complete" })).toMatch(/completada/);
    expect(dbErrorMessage({ code: "23503" })).toMatch(/No se puede eliminar/);
  });
});
