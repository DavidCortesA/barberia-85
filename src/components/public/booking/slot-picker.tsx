"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime12 } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SlotDto } from "./types";

type SlotPickerProps = {
  serviceId: string;
  date: string;
  value: string | null;
  onChange: (time: string) => void;
  /** Cambia para forzar una nueva consulta (p. ej. tras "horario ocupado"). */
  refreshKey: number;
  onPickAnotherDay: () => void;
};

type Result = { key: string; slots: SlotDto[] | null };

/**
 * Consulta /api/availability (cálculo en servidor) y muestra los horarios.
 * Estados: cargando (skeleton), error con reintento, vacío y lista.
 */
export function SlotPicker({ serviceId, date, value, onChange, refreshKey, onPickAnotherDay }: SlotPickerProps) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result>({ key: "", slots: null });
  const key = `${serviceId}|${date}|${refreshKey}|${retry}`;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ service: serviceId, date });

    fetch(`/api/availability?${params}`, { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { slots: SlotDto[] }) => setResult({ key, slots: data.slots }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult({ key, slots: null });
      });

    return () => controller.abort();
  }, [key, serviceId, date]);

  const loading = result.key !== key;
  const failed = !loading && result.slots === null;
  const slots = result.slots ?? [];
  const availableCount = slots.filter((s) => s.available).length;

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Cargando horarios" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div role="alert" className="border-border bg-ink-900 rounded-[4px] border p-6 text-center">
        <p className="font-display text-xl font-bold">No pudimos cargar los horarios</p>
        <p className="text-muted-foreground mt-2 text-sm">Revisa tu conexión e inténtalo de nuevo.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setRetry((n) => n + 1)}>
          <RefreshCw /> Reintentar
        </Button>
      </div>
    );
  }

  if (availableCount === 0) {
    return (
      <div className="border-border bg-ink-900 rounded-[4px] border p-6 text-center">
        <p className="font-display text-xl font-bold">No hay horarios disponibles este día</p>
        <p className="text-muted-foreground mt-2 text-sm">Prueba con otra fecha.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onPickAnotherDay}>
          Elegir otro día
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p aria-live="polite" className="text-muted-foreground mb-3 text-sm">
        {availableCount} {availableCount === 1 ? "horario disponible" : "horarios disponibles"} · hora de Monterrey
      </p>
      <div role="radiogroup" aria-label="Horarios disponibles" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((slot) => {
          const selected = value === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!slot.available}
              onClick={() => onChange(slot.time)}
              className={cn(
                "h-11 rounded-[3px] border text-sm font-semibold transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 focus-visible:outline-none",
                selected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-ink-900 hover:border-primary",
                !slot.available && "cursor-not-allowed line-through opacity-35 hover:border-border",
              )}
            >
              {formatTime12(slot.time)}
              {!slot.available && <span className="sr-only"> (no disponible)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
