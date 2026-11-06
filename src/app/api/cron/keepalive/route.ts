import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/config/env.server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${getServerEnv().CRON_SECRET}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Tarea diaria (cron de Vercel, ver vercel.json). Vercel envía
 * `Authorization: Bearer ${CRON_SECRET}` automáticamente.
 *   1. Consulta mínima: evita que Supabase Free pause el proyecto por inactividad.
 *   2. expire_stale_pending(): marca como vencidas las solicitudes cuya hora ya pasó.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const ping = await db.from("business_settings").select("id").limit(1);
  if (ping.error) {
    console.error("[cron] ping", ping.error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: expired, error } = await db.rpc("expire_stale_pending");
  if (error) {
    console.error("[cron] expire_stale_pending", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expired }, { headers: { "Cache-Control": "no-store" } });
}
