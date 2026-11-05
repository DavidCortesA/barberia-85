import { describe, expect, it } from "vitest";
import { formatDuration, formatTime12 } from "@/lib/format";
import { summarizeWeeklyHours } from "./format";

describe("summarizeWeeklyHours", () => {
  const rows = [
    ...[1, 2, 3, 4, 5, 6].map((d) => ({ day_of_week: d, opening_time: "10:00:00", closing_time: "19:00:00", is_closed: false })),
    { day_of_week: 0, opening_time: null, closing_time: null, is_closed: true },
  ];

  it("agrupa días consecutivos con el mismo horario", () => {
    expect(summarizeWeeklyHours(rows)).toEqual([
      { label: "Lunes a sábado", value: "10:00 a. m. – 7:00 p. m." },
      { label: "Domingo", value: "Cerrado" },
    ]);
  });

  it("separa cuando el horario cambia", () => {
    const mixed = rows.map((r) => (r.day_of_week === 6 ? { ...r, closing_time: "15:00:00" } : r));
    expect(summarizeWeeklyHours(mixed)).toEqual([
      { label: "Lunes a viernes", value: "10:00 a. m. – 7:00 p. m." },
      { label: "Sábado", value: "10:00 a. m. – 3:00 p. m." },
      { label: "Domingo", value: "Cerrado" },
    ]);
  });

  it("muestra varios rangos del mismo día", () => {
    const split = [
      { day_of_week: 1, opening_time: "10:00:00", closing_time: "14:00:00", is_closed: false },
      { day_of_week: 1, opening_time: "16:00:00", closing_time: "19:00:00", is_closed: false },
    ];
    expect(summarizeWeeklyHours(split)[0]).toEqual({
      label: "Lunes",
      value: "10:00 a. m. – 2:00 p. m., 4:00 p. m. – 7:00 p. m.",
    });
  });

  it("sin datos: todo cerrado", () => {
    expect(summarizeWeeklyHours([])).toEqual([{ label: "Lunes a domingo", value: "Cerrado" }]);
  });
});

describe("formatTime12 / formatDuration", () => {
  it("convierte a formato de 12 horas", () => {
    expect(formatTime12("00:00")).toBe("12:00 a. m.");
    expect(formatTime12("09:05")).toBe("9:05 a. m.");
    expect(formatTime12("12:00")).toBe("12:00 p. m.");
    expect(formatTime12("18:30")).toBe("6:30 p. m.");
  });

  it("formatea duraciones", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(75)).toBe("1 h 15 min");
  });
});
