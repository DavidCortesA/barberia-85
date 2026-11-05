import { describe, expect, it } from "vitest";
import {
  computeSlots,
  resolveRangesForDate,
  type ComputeSlotsInput,
  type Interval,
} from "./availability";

// Monterrey es UTC-6 todo el año (sin horario de verano desde 2022).
// jueves 2026-11-05 09:00 hora local = 15:00Z
const NOW = new Date("2026-11-05T15:00:00Z");
const MONDAY = "2026-11-09";
const local = (date: string, hm: string) => new Date(`${date}T${hm}:00-06:00`);
const busy = (date: string, from: string, to: string): Interval => ({
  start: local(date, from),
  end: local(date, to),
});

const base: ComputeSlotsInput = {
  date: MONDAY,
  now: NOW,
  durationMinutes: 45,
  slotIntervalMinutes: 30,
  minNoticeMinutes: 60,
  maxAdvanceDays: 30,
  ranges: [{ start: "10:00", end: "19:00" }],
  busy: [],
};

const times = (input: Partial<ComputeSlotsInput> = {}, onlyAvailable = false) =>
  computeSlots({ ...base, ...input })
    .filter((s) => !onlyAvailable || s.available)
    .map((s) => s.time);

describe("computeSlots", () => {
  it("genera inicios alineados y el servicio completo cabe antes del cierre", () => {
    const t = times();
    expect(t[0]).toBe("10:00");
    expect(t.at(-1)).toBe("18:00"); // 18:00 + 45 min = 18:45 ≤ 19:00; 18:30 ya no cabe
    expect(t).toHaveLength(17);
  });

  it("respeta la duración: un servicio de 60 min deja 18:00 como último inicio", () => {
    expect(times({ durationMinutes: 60 }).at(-1)).toBe("18:00");
    expect(times({ durationMinutes: 90 }).at(-1)).toBe("17:30");
  });

  it("marca como ocupados los slots que se traslapan con una cita", () => {
    // ocupado 11:00-11:45
    const s = computeSlots({ ...base, busy: [busy(MONDAY, "11:00", "11:45")] });
    const byTime = Object.fromEntries(s.map((x) => [x.time, x.available]));
    expect(byTime["10:00"]).toBe(true); // 10:00-10:45 termina antes
    expect(byTime["10:30"]).toBe(false); // 10:30-11:15 invade
    expect(byTime["11:00"]).toBe(false);
    expect(byTime["11:30"]).toBe(false); // 11:30-12:15 invade (la cita termina 11:45)
    expect(byTime["12:00"]).toBe(true);
  });

  it("citas contiguas no se consideran traslape", () => {
    const s = computeSlots({
      ...base,
      durationMinutes: 30,
      busy: [busy(MONDAY, "11:00", "11:30")],
    });
    const byTime = Object.fromEntries(s.map((x) => [x.time, x.available]));
    expect(byTime["10:30"]).toBe(true); // termina justo cuando empieza la ocupada
    expect(byTime["11:30"]).toBe(true); // empieza justo cuando termina
  });

  it("no ofrece un hueco que no alcanza para la duración", () => {
    // libres solo 12:30-13:00 (30 min) entre dos ocupadas; servicio de 60 min
    const s = computeSlots({
      ...base,
      durationMinutes: 60,
      busy: [busy(MONDAY, "12:00", "12:30"), busy(MONDAY, "13:00", "14:00")],
    });
    expect(s.find((x) => x.time === "12:30")?.available).toBe(false);
  });

  it("aplica el aviso mínimo", () => {
    // ahora = lunes 09:30 local; aviso 60 min → primer inicio permitido 10:30
    const now = local(MONDAY, "09:30");
    const t = times({ now }, true);
    expect(t[0]).toBe("10:30");
    expect(times({ now })).toContain("10:00"); // existe pero no disponible
  });

  it("devuelve vacío para fechas pasadas", () => {
    expect(times({ date: "2026-11-04" })).toEqual([]);
  });

  it("hoy: solo horarios futuros respetando el aviso", () => {
    const now = local("2026-11-05", "12:10");
    const t = times({ date: "2026-11-05", now }, true);
    expect(t[0]).toBe("13:30"); // 12:10 + 60 = 13:10 → primer múltiplo de 30 posterior
  });

  it("devuelve vacío más allá de la anticipación máxima", () => {
    expect(times({ date: "2026-12-06" })).toEqual([]); // hoy+31
    expect(times({ date: "2026-12-05" }).length).toBeGreaterThan(0); // hoy+30
  });

  it("día cerrado (sin rangos) no tiene slots", () => {
    expect(times({ ranges: [] })).toEqual([]);
  });

  it("soporta varios rangos en el día (cierre a la hora de comida)", () => {
    const t = times({
      durationMinutes: 30,
      ranges: [
        { start: "10:00", end: "14:00" },
        { start: "16:00", end: "19:00" },
      ],
    });
    expect(t).toContain("13:30");
    expect(t).not.toContain("14:00");
    expect(t).not.toContain("15:00");
    expect(t).toContain("16:00");
  });

  it("alinea al intervalo aunque el horario abra en minutos no alineados", () => {
    const t = times({ ranges: [{ start: "10:10", end: "12:00" }], durationMinutes: 30 });
    expect(t[0]).toBe("10:30");
  });

  it("respeta el intervalo configurado (15 min)", () => {
    const t = times({ slotIntervalMinutes: 15, ranges: [{ start: "10:00", end: "11:00" }], durationMinutes: 30 });
    expect(t).toEqual(["10:00", "10:15", "10:30"]);
  });
});

describe("resolveRangesForDate", () => {
  const weekly = [
    ...[1, 2, 3, 4, 5, 6].map((d) => ({ day_of_week: d, opening_time: "10:00:00", closing_time: "19:00:00", is_closed: false })),
    { day_of_week: 0, opening_time: null, closing_time: null, is_closed: true },
  ];

  it("usa el horario semanal (lunes abierto)", () => {
    expect(resolveRangesForDate(MONDAY, weekly)).toEqual([{ start: "10:00", end: "19:00" }]);
  });

  it("domingo cerrado", () => {
    expect(resolveRangesForDate("2026-11-08", weekly)).toEqual([]);
  });

  it("una excepción de cierre reemplaza al horario semanal", () => {
    expect(resolveRangesForDate(MONDAY, weekly, { is_closed: true, opening_time: null, closing_time: null })).toEqual([]);
  });

  it("una excepción con horario especial reemplaza al semanal", () => {
    expect(
      resolveRangesForDate(MONDAY, weekly, { is_closed: false, opening_time: "12:00:00", closing_time: "16:00:00" }),
    ).toEqual([{ start: "12:00", end: "16:00" }]);
  });

  it("ordena varios rangos del mismo día", () => {
    const split = [
      { day_of_week: 1, opening_time: "16:00:00", closing_time: "19:00:00", is_closed: false },
      { day_of_week: 1, opening_time: "10:00:00", closing_time: "14:00:00", is_closed: false },
    ];
    expect(resolveRangesForDate(MONDAY, split)).toEqual([
      { start: "10:00", end: "14:00" },
      { start: "16:00", end: "19:00" },
    ]);
  });
});
