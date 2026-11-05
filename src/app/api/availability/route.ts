import { NextResponse } from "next/server";
import { z } from "zod";
import { ymdSchema } from "@/features/appointments/schemas";
import { getAvailability } from "@/features/schedule/queries";

// La disponibilidad cambia con cada reserva: nunca se cachea.
export const dynamic = "force-dynamic";

const querySchema = z.object({
  service: z.uuid(),
  date: ymdSchema,
});

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    service: params.get("service"),
    date: params.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400, headers: noStore });
  }

  try {
    const result = await getAvailability(parsed.data.service, parsed.data.date);
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 404, headers: noStore });
    }
    return NextResponse.json({ date: result.date, slots: result.slots }, { headers: noStore });
  } catch (err) {
    console.error("[availability] error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: noStore });
  }
}
