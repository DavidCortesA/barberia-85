import { NextResponse, type NextRequest } from "next/server";
import { getAppointmentsInRange, getBlockedSlotsInRange } from "@/features/appointments/admin-queries";
import { getPanelSession } from "@/features/auth/dal";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 62;

/** GET ?from=yyyy-MM-dd&to=yyyy-MM-dd → citas y bloqueos del rango (admin y staff). */
export async function GET(request: NextRequest) {
  const session = await getPanelSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (!YMD.test(from) || !YMD.test(to) || !(days > 0 && days <= MAX_RANGE_DAYS)) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  try {
    const [appointments, blocks] = await Promise.all([
      getAppointmentsInRange(session.supabase, from, to),
      getBlockedSlotsInRange(session.supabase, from, to),
    ]);
    return NextResponse.json({ appointments, blocks }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[calendar]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
