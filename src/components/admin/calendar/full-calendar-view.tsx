"use client";

import type { DatesSetArg, EventClickArg, EventInput } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { AppointmentSheet } from "@/components/admin/appointments/appointment-sheet";
import { useAppointmentActions } from "@/components/admin/appointments/use-appointment-actions";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { displayStatus, statusColors, statusLabels, type DisplayStatus } from "@/features/appointments/status";
import type { AppointmentView } from "@/features/appointments/view";
import { toFloatingIso } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { WeeklyRange } from "./calendar-view";

type Block = { id: string; start: string; end: string; reason: string | null; barberName: string | null };
type CalendarData = { appointments: AppointmentView[]; blocks: Block[] };
type Loaded = CalendarData & { loadedAt: number };

const FILTERS: DisplayStatus[] = ["pending", "overdue", "confirmed", "completed", "cancelled", "rejected", "expired"];
const DEFAULT_VISIBLE: DisplayStatus[] = ["pending", "overdue", "confirmed", "completed"];
const DARK_TEXT = new Set<DisplayStatus>(["pending", "confirmed", "completed"]);

function hm(minutes: number) {
  const h = Math.max(0, Math.min(24, Math.floor(minutes / 60)));
  return `${String(h).padStart(2, "0")}:00:00`;
}

export default function FullCalendarView({ businessHours }: { businessHours: WeeklyRange[] }) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const rangeRef = useRef<{ from: string; to: string } | null>(null);
  const requestId = useRef(0);
  const [data, setData] = useState<Loaded>({ appointments: [], blocks: [], loadedAt: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState<Set<DisplayStatus>>(() => new Set(DEFAULT_VISIBLE));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (from: string, to: string) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar?from=${from}&to=${to}`, { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login?next=/admin/calendar");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as CalendarData;
      if (id === requestId.current) {
        setData({ ...json, loadedAt: Date.now() });
        setError(false);
      }
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [router]);

  const reload = useCallback(() => {
    if (rangeRef.current) void load(rangeRef.current.from, rangeRef.current.to);
  }, [load]);

  const actions = useAppointmentActions({ onChanged: reload });

  // FullCalendar trabaja en UTC con horas "flotantes": el rango visible ya está en fechas locales.
  function onDatesSet(arg: DatesSetArg) {
    const range = { from: arg.startStr.slice(0, 10), to: arg.endStr.slice(0, 10) };
    rangeRef.current = range;
    void load(range.from, range.to);
  }

  const events = useMemo<EventInput[]>(() => {
    const appts = data.appointments
      .map((a) => ({ a, status: displayStatus(a.status, a.startsAt, data.loadedAt) }))
      .filter(({ status }) => visible.has(status))
      .map(({ a, status }) => ({
        id: a.id,
        title: `${a.customerName} · ${a.serviceName}`,
        start: toFloatingIso(a.startsAt),
        end: toFloatingIso(a.endsAt),
        backgroundColor: statusColors[status],
        borderColor: statusColors[status],
        textColor: DARK_TEXT.has(status) ? "#090909" : "#f5f3ef",
        classNames: [`fc-st-${status}`],
        extendedProps: { status },
      }));
    const blocks = data.blocks.map((b) => ({
      id: `block-${b.id}`,
      title: b.reason ? `Bloqueado: ${b.reason}` : "Bloqueado",
      start: toFloatingIso(b.start),
      end: toFloatingIso(b.end),
      display: "background",
      classNames: ["fc-blocked"],
    }));
    return [...blocks, ...appts];
  }, [data, visible]);

  const { slotMinTime, slotMaxTime } = useMemo(() => {
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    if (businessHours.length === 0) return { slotMinTime: "08:00:00", slotMaxTime: "21:00:00" };
    const min = Math.min(...businessHours.map((r) => toMin(r.open))) - 60;
    const max = Math.max(...businessHours.map((r) => toMin(r.close))) + 60;
    return { slotMinTime: hm(min), slotMaxTime: hm(max + 59) };
  }, [businessHours]);

  const selected = data.appointments.find((a) => a.id === selectedId) ?? null;
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  function toggle(status: DisplayStatus) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado">
        {FILTERS.map((s) => {
          const on = visible.has(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
                on ? "border-bone/30 bg-ink-800 text-foreground" : "border-border text-muted-foreground opacity-60 hover:opacity-100",
              )}
            >
              <span className="size-2.5 rounded-full" style={{ background: statusColors[s] }} aria-hidden />
              {s === "overdue" ? "Pendiente vencida" : statusLabels[s]}
            </button>
          );
        })}
        <span className="text-muted-foreground ml-auto inline-flex items-center gap-2 text-xs">
          <span className="fc-blocked-swatch size-3 rounded-[2px]" aria-hidden /> Bloqueo de agenda
        </span>
      </div>

      {error && (
        <ErrorState
          title="No se pudieron cargar las citas"
          description="Revisa tu conexión e inténtalo de nuevo."
          action={<Button onClick={reload}>Reintentar</Button>}
        />
      )}

      <div className={cn("admin-calendar border-border bg-ink-900 relative rounded-[4px] border p-2 sm:p-4", loading && "opacity-70")} aria-busy={loading}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={esLocale}
          timeZone="UTC"
          // "Hoy" y la línea de la hora actual en hora de la barbería (no en UTC).
          now={() => toFloatingIso(new Date())}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          headerToolbar={
            isMobile
              ? { left: "prev,next", center: "title", right: "today" }
              : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
          }
          footerToolbar={isMobile ? { center: "dayGridMonth,timeGridWeek,timeGridDay" } : undefined}
          buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
          height="auto"
          expandRows
          nowIndicator
          allDaySlot={false}
          slotDuration="00:30:00"
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          businessHours={businessHours.map((r) => ({ daysOfWeek: [r.day], startTime: r.open, endTime: r.close }))}
          dayMaxEvents={3}
          events={events}
          datesSet={onDatesSet}
          eventClick={(arg: EventClickArg) => {
            if (arg.event.display === "background") return;
            arg.jsEvent.preventDefault();
            setSelectedId(arg.event.id);
          }}
          eventDidMount={(arg) => {
            // Accesible por teclado: cada cita es un botón con nombre descriptivo.
            if (arg.event.display === "background") return;
            arg.el.setAttribute("role", "button");
            arg.el.setAttribute("tabindex", "0");
            const status = arg.event.extendedProps.status as DisplayStatus;
            arg.el.setAttribute("aria-label", `${arg.event.title}, ${statusLabels[status]}`);
            arg.el.addEventListener("keydown", (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedId(arg.event.id);
              }
            });
          }}
        />
      </div>

      <AppointmentSheet
        appointment={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onAction={actions.ask}
        busy={actions.busy}
      />
      {actions.dialogs}
    </div>
  );
}
