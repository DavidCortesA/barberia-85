import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, confirmationMessage, normalizeMxPhone, toE164Mx } from "@/lib/whatsapp";
import { bookingSchema, detailsSchema } from "./schemas";
import { toBookingErrorCode } from "./errors";

describe("normalizeMxPhone", () => {
  it.each([
    ["8112345678", "8112345678"],
    ["81 1234 5678", "8112345678"],
    ["(81) 1234-5678", "8112345678"],
    ["+52 81 1234 5678", "8112345678"],
    ["528112345678", "8112345678"],
    ["+52 1 81 1234 5678", "8112345678"],
  ])("normaliza %s", (input, expected) => {
    expect(normalizeMxPhone(input)).toBe(expected);
  });

  it.each(["", "123", "81123456789", "abcdefghij", "+1 305 123 4567"])("rechaza %s", (input) => {
    expect(normalizeMxPhone(input)).toBeNull();
  });
});

describe("WhatsApp", () => {
  it("construye E.164 y enlace wa.me con el texto codificado", () => {
    expect(toE164Mx("8112345678")).toBe("+528112345678");
    expect(buildWhatsAppLink("8112345678")).toBe("https://wa.me/528112345678");
    const link = buildWhatsAppLink("8112345678", "Hola, ¿qué tal? & más");
    expect(link).toBe(`https://wa.me/528112345678?text=${encodeURIComponent("Hola, ¿qué tal? & más")}`);
    expect(link).not.toContain(" ");
  });

  it("redacta el mensaje de confirmación acordado", () => {
    expect(confirmationMessage({ name: "Juan", dateText: "lunes 9 de noviembre", timeText: "11:00 a. m." })).toBe(
      "Hola, Juan. Tu cita en 85 BARBERÍA ha sido confirmada para el día lunes 9 de noviembre a las 11:00 a. m. ¡Te esperamos!",
    );
  });
});

describe("detailsSchema", () => {
  const ok = { fullName: "José Ángel Peña-Núñez", phone: "81 1234 5678", notes: "" };

  it("acepta nombres con acentos y ñ", () => {
    expect(detailsSchema.safeParse(ok).success).toBe(true);
    expect(detailsSchema.safeParse({ ...ok, fullName: "María O'Brien Jr." }).success).toBe(true);
  });

  it.each(["A", "<script>alert(1)</script>", "Juan123", "   ", "x".repeat(81)])("rechaza nombre %j", (fullName) => {
    expect(detailsSchema.safeParse({ ...ok, fullName }).success).toBe(false);
  });

  it("rechaza teléfono inválido y notas largas", () => {
    expect(detailsSchema.safeParse({ ...ok, phone: "12345" }).success).toBe(false);
    expect(detailsSchema.safeParse({ ...ok, notes: "x".repeat(501) }).success).toBe(false);
  });
});

describe("bookingSchema", () => {
  const valid = {
    serviceId: "3f1c2a52-8d0e-4a4c-9b57-0a1d2c3e4f5a",
    date: "2026-11-09",
    time: "11:00",
    fullName: "Juan Pérez",
    phone: "8112345678",
    notes: "",
  };

  it("acepta una solicitud válida", () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ serviceId: "no-es-uuid" }],
    [{ date: "2026-02-31" }],
    [{ date: "09/11/2026" }],
    [{ time: "25:00" }],
    [{ time: "9:00" }],
  ])("rechaza campos inválidos %j", (patch) => {
    expect(bookingSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("toBookingErrorCode", () => {
  it("mapea los códigos de la función SQL y degrada a unknown", () => {
    expect(toBookingErrorCode("slot_unavailable")).toBe("slot_unavailable");
    expect(toBookingErrorCode("too_many_pending")).toBe("too_many_pending");
    expect(toBookingErrorCode("algo raro")).toBe("unknown");
    expect(toBookingErrorCode(undefined)).toBe("unknown");
  });
});
