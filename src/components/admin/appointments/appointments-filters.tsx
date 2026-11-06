"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { NativeSelect } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppointmentFilters } from "@/features/appointments/admin-queries";
import { allStatuses, statusLabels } from "@/features/appointments/status";

/** Filtros de la tabla de citas. Viven en la URL para poder compartir/recargar. */
export function AppointmentsFilters({ filters }: { filters: AppointmentFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(filters.q);
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("pagina");
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }));
  }

  // Búsqueda con espera corta para no consultar en cada tecla.
  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = filters.status !== "all" || !!filters.date || !!filters.q || filters.scope !== "upcoming";

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_160px_170px_auto]" aria-busy={pending}>
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          aria-label="Buscar por nombre o teléfono"
          className="h-10 pl-9"
          maxLength={60}
        />
      </div>
      <NativeSelect aria-label="Estado" value={filters.status} onChange={(e) => update({ estado: e.target.value === "all" ? null : e.target.value })}>
        <option value="all">Todos los estados</option>
        {allStatuses.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
        <option value="overdue">Pendientes vencidas</option>
      </NativeSelect>
      <NativeSelect
        aria-label="Periodo"
        value={filters.scope}
        disabled={!!filters.date}
        onChange={(e) => update({ ver: e.target.value === "upcoming" ? null : e.target.value })}
      >
        <option value="upcoming">Hoy en adelante</option>
        <option value="past">Pasadas</option>
        <option value="all">Todas</option>
      </NativeSelect>
      <Input
        type="date"
        aria-label="Fecha"
        value={filters.date ?? ""}
        onChange={(e) => update({ fecha: e.target.value || null })}
        className="h-10"
      />
      {hasFilters ? (
        <Button
          variant="ghost"
          className="h-10"
          onClick={() => {
            setQ("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
        >
          <X aria-hidden /> Limpiar
        </Button>
      ) : (
        <span className="hidden lg:block" />
      )}
    </div>
  );
}
