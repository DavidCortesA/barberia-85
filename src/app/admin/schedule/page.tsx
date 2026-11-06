import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { BlockedSlotsEditor } from "@/components/admin/schedule/blocked-slots-editor";
import { ExceptionsEditor } from "@/components/admin/schedule/exceptions-editor";
import { WeeklyHoursEditor } from "@/components/admin/schedule/weekly-hours-editor";
import { requireAdmin } from "@/features/auth/dal";
import { shopDateKey } from "@/lib/date";

export const metadata: Metadata = { title: "Horarios" };

export default async function ScheduleAdminPage() {
  const { supabase } = await requireAdmin();
  const today = shopDateKey(new Date());

  const [hoursRes, excRes, blocksRes, barbersRes] = await Promise.all([
    supabase.from("business_hours").select("day_of_week, opening_time, closing_time, is_closed").order("opening_time"),
    supabase.from("schedule_exceptions").select("*").gte("exception_date", today).order("exception_date"),
    supabase
      .from("blocked_slots")
      .select("id, start_datetime, end_datetime, reason, barber:barbers(name)")
      .gte("end_datetime", new Date().toISOString())
      .order("start_datetime"),
    supabase.from("barbers").select("id, name").eq("is_active", true).order("name"),
  ]);
  for (const r of [hoursRes, excRes, blocksRes, barbersRes]) if (r.error) throw new Error(r.error.message);

  return (
    <>
      <PageHeader
        title="Horarios"
        description="Horario semanal, días especiales y bloqueos de agenda. Las reglas de reserva (intervalo, aviso mínimo…) están en Configuración."
      />
      <div className="space-y-6">
        <WeeklyHoursEditor rows={hoursRes.data ?? []} />
        <div className="grid gap-6 xl:grid-cols-2">
          <ExceptionsEditor exceptions={excRes.data ?? []} today={today} />
          <BlockedSlotsEditor
            today={today}
            barbers={barbersRes.data ?? []}
            blocks={(blocksRes.data ?? []).map((b) => ({
              id: b.id,
              start: b.start_datetime,
              end: b.end_datetime,
              reason: b.reason,
              barberName: b.barber?.name ?? null,
            }))}
          />
        </div>
      </div>
    </>
  );
}
