/**
 * Pruebas de humo contra la base de datos REAL (Supabase), con las claves de .env.local.
 *   npm run test:db
 *
 * Cubre: permisos de anon (RLS), reglas de reserva (horario, aviso mínimo, anticipación,
 * alineación, conflictos, límite por teléfono), constraint de exclusión, transiciones de
 * estado, bloqueos de agenda, historial y disponibilidad sin datos personales.
 *
 * Crea únicamente clientes con teléfonos +52550000000X y los elimina al terminar.
 * Requiere que existan los servicios y el horario de ejemplo (supabase/seed.sql):
 * lunes a sábado 10:00-19:00, domingo cerrado, intervalo 30 min, aviso 60 min, 30 días.
 * Si el negocio ya cambió esos datos, ajusta las constantes de abajo o las pruebas fallarán
 * por datos, no por errores de código.
 */
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const ROOT = path.resolve(__dirname, "..");
const req = createRequire(path.join(ROOT, "package.json"));
const { createClient } = req("@supabase/supabase-js");

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const svc = createClient(url, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  cond ? pass++ : fail++;
  console.log((cond ? "PASS" : "FAIL") + "  " + name + (extra ? "  -> " + extra : ""));
};
const PHONE = "+525500000001", PHONE2 = "+525500000002", PHONE3 = "+525500000003";

// Próximo día de semana (0=dom..6=sáb) a >= minDays, en hora local fija UTC-6 (Monterrey).
function nextWeekday(dow, minDays = 3) {
  const base = new Date(Date.now() - 6 * 3600e3 + minDays * 86400e3);
  while (base.getUTCDay() !== dow) base.setUTCDate(base.getUTCDate() + 1);
  return base.toISOString().slice(0, 10);
}
const at = (d, hm) => `${d}T${hm}:00-06:00`;
const plus = (iso, min) => new Date(new Date(iso).getTime() + min * 60e3).toISOString();
const rpc = (starts, phone, svcId, extra = {}) =>
  svc.rpc("create_appointment_request", {
    p_service_id: svcId, p_starts_at: starts, p_full_name: "Prueba Automatica", p_phone: phone, ...extra,
  });

async function cleanup() {
  const cs = await svc.from("customers").select("id").in("phone", [PHONE, PHONE2, PHONE3]);
  const ids = (cs.data || []).map((c) => c.id);
  if (ids.length) {
    await svc.from("appointments").delete().in("customer_id", ids);
    await svc.from("customers").delete().in("id", ids);
  }
  await svc.from("blocked_slots").delete().eq("reason", "prueba-automatica");
}

(async () => {
  await cleanup(); // por si una corrida anterior se interrumpió

  // --- Acceso anónimo (RLS) ---
  const s = await anon.from("services").select("id,name").order("sort_order");
  ok("anon lee servicios activos", !s.error && s.data.length >= 1, `${s.data?.length} filas`);
  for (const t of ["customers", "appointments", "blocked_slots", "appointment_events", "profiles"]) {
    const r = await anon.from(t).select("*").limit(1);
    ok(`anon NO lee ${t}`, !!r.error || (r.data || []).length === 0, r.error ? r.error.code : "0 filas");
  }
  const ins = await anon.from("customers").insert({ full_name: "Hacker", phone: "+525599999999" });
  ok("anon NO inserta customers", !!ins.error, ins.error?.code);
  const upd = await anon.from("services").update({ price: 1 }).eq("name", s.data[0].name).select();
  ok("anon NO modifica services", !!upd.error || (upd.data || []).length === 0);
  const wc = await anon.from("site_content").insert({ key: "hero.eyebrow", value: "x" });
  ok("anon NO escribe site_content", !!wc.error, wc.error?.code);
  const rp = await anon.rpc("create_appointment_request", {
    p_service_id: s.data[0].id, p_starts_at: new Date().toISOString(), p_full_name: "x", p_phone: PHONE,
  });
  ok("anon NO ejecuta create_appointment_request", !!rp.error, rp.error?.code);
  const bi = await anon.rpc("get_busy_intervals", {
    p_from: new Date().toISOString(), p_to: new Date(Date.now() + 864e5).toISOString(),
  });
  ok("anon NO ejecuta get_busy_intervals", !!bi.error, bi.error?.code);

  // --- Reglas de reserva (service_role vía RPC) ---
  const svcId = s.data[0].id; // servicio de 45 min y $150 en el seed
  const mon = nextWeekday(1), sun = nextWeekday(0);
  let r = await rpc(at(mon, "11:00"), PHONE, svcId);
  ok("crea solicitud valida (lunes 11:00)", !r.error && r.data.status === "pending", r.error?.message);
  const first = r.data;
  ok("snapshots y fecha local correctos",
    first && Number(first.price_snapshot) === 150 && first.duration_snapshot === 45 && first.appointment_date === mon);
  r = await rpc(at(mon, "11:00"), PHONE2, svcId);
  ok("rechaza mismo horario", r.error?.message === "slot_unavailable", r.error?.message);
  r = await rpc(at(mon, "11:30"), PHONE2, svcId);
  ok("rechaza traslape parcial (11:30 vs 11:00-11:45)", r.error?.message === "slot_unavailable", r.error?.message);
  r = await rpc(at(mon, "12:00"), PHONE2, svcId);
  ok("acepta horario contiguo (12:00)", !r.error, r.error?.message);
  const second = r.data;
  r = await rpc(at(sun, "11:00"), PHONE2, svcId);
  ok("rechaza domingo", r.error?.message === "outside_business_hours", r.error?.message);
  r = await rpc(at(mon, "18:30"), PHONE2, svcId);
  ok("rechaza cita que termina despues del cierre (18:30 + 45)", r.error?.message === "outside_business_hours", r.error?.message);
  r = await rpc(at(mon, "13:10"), PHONE2, svcId);
  ok("rechaza horario desalineado (13:10)", r.error?.message === "bad_slot_alignment", r.error?.message);
  r = await rpc(new Date(Date.now() - 3600e3).toISOString(), PHONE2, svcId);
  ok("rechaza pasado (too_soon)", r.error?.message === "too_soon", r.error?.message);
  r = await rpc(at(nextWeekday(1, 60), "11:00"), PHONE2, svcId);
  ok("rechaza mas alla de 30 dias (too_far)", r.error?.message === "too_far", r.error?.message);
  r = await svc.rpc("create_appointment_request", {
    p_service_id: svcId, p_starts_at: at(mon, "15:00"), p_full_name: "A", p_phone: "5512345678",
  });
  ok("rechaza datos invalidos (invalid_input)", r.error?.message === "invalid_input", r.error?.message);
  r = await rpc(at(mon, "16:00"), PHONE, svcId);
  ok("2a pendiente del mismo telefono: OK", !r.error, r.error?.message);
  r = await rpc(at(mon, "17:00"), PHONE, svcId);
  ok("3a pendiente del mismo telefono rechazada", r.error?.message === "too_many_pending", r.error?.message);

  // --- Concurrencia: 8 solicitudes simultáneas al mismo horario → exactamente 1 gana ---
  const racers = await Promise.all(
    Array.from({ length: 8 }, (_, i) => rpc(at(mon, "10:00"), `+52550000010${i}`, svcId)),
  );
  const winners = racers.filter((x) => !x.error).length;
  ok("concurrencia: 8 solicitudes simultaneas, solo 1 se registra", winners === 1, `${winners} aceptadas`);
  const raceIds = racers.filter((x) => !x.error).map((x) => x.data.customer_id);
  const raceCustomers = await svc.from("customers").select("id").like("phone", "+52550000010%");
  const allRaceIds = (raceCustomers.data || []).map((c) => c.id);

  // --- Confirmación y constraint de exclusión ---
  let u = await svc.from("appointments").update({ status: "confirmed" }).eq("id", first.id).select().single();
  ok("pending -> confirmed", !u.error && u.data.status === "confirmed", u.error?.message);
  const dup = await svc.from("appointments").insert({
    customer_id: first.customer_id, service_id: svcId, starts_at: at(mon, "11:15"),
    ends_at: plus(at(mon, "11:15"), 45), status: "confirmed", price_snapshot: 150, duration_snapshot: 45,
  });
  ok("BD impide 2 confirmadas traslapadas (23P01)", dup.error?.code === "23P01", dup.error?.code);
  const ov = await svc.from("appointments").insert({
    customer_id: first.customer_id, service_id: svcId, starts_at: at(mon, "11:30"),
    ends_at: plus(at(mon, "11:30"), 45), status: "pending", price_snapshot: 150, duration_snapshot: 45,
  }).select().single();
  ok("pendiente traslapada insertada directo (el hold lo gestiona la RPC)", !ov.error, ov.error?.message);
  if (ov.data) {
    const c = await svc.from("appointments").update({ status: "confirmed" }).eq("id", ov.data.id);
    ok("confirmar pendiente que traslapa con confirmada -> 23P01", c.error?.code === "23P01", c.error?.code);
  }
  let t = await svc.from("appointments").update({ status: "pending" }).eq("id", first.id);
  ok("confirmed -> pending prohibido", t.error?.message === "invalid_status_transition", t.error?.message);
  t = await svc.from("appointments").update({ status: "completed" }).eq("id", first.id);
  ok("completar cita futura prohibido", t.error?.message === "too_early_to_complete", t.error?.message);
  t = await svc.from("appointments").update({ price_snapshot: 1 }).eq("id", first.id);
  ok("snapshot de precio inmutable", t.error?.message === "immutable_fields", t.error?.message);
  t = await svc.from("appointments").update({ status: "rejected" }).eq("id", second.id).select().single();
  ok("pending -> rejected", !t.error && t.data.status === "rejected", t.error?.message);
  // la pendiente insertada a mano (11:30-12:15) también bloquea las 12:00; se rechaza para liberar
  if (ov.data) await svc.from("appointments").update({ status: "rejected" }).eq("id", ov.data.id);
  r = await rpc(at(mon, "12:00"), PHONE2, svcId);
  ok("horario de cita rechazada vuelve a estar libre", !r.error, r.error?.message);

  // --- Bloqueos y disponibilidad ---
  const blk = await svc.from("blocked_slots")
    .insert({ start_datetime: at(mon, "14:00"), end_datetime: at(mon, "15:00"), reason: "prueba-automatica" }).select().single();
  r = await rpc(at(mon, "14:00"), PHONE3, svcId);
  ok("rechaza horario bloqueado", r.error?.message === "slot_unavailable", r.error?.message);
  const busy = await svc.rpc("get_busy_intervals", { p_from: at(mon, "00:00"), p_to: at(mon, "23:59") });
  ok("get_busy_intervals devuelve ocupados sin datos personales",
    !busy.error && busy.data.length >= 3 && Object.keys(busy.data[0]).sort().join() === "ends_at,starts_at",
    `${busy.data?.length} intervalos`);
  const ev = await svc.from("appointment_events").select("to_status").eq("appointment_id", first.id);
  ok("historial de estados registrado", !ev.error && ev.data.length >= 2, `${ev.data?.length} eventos`);

  // --- Limpieza (solo datos de prueba) ---
  await svc.from("blocked_slots").delete().eq("id", blk.data.id);
  const ids = [...new Set([...allRaceIds, ...raceIds])];
  if (ids.length) {
    await svc.from("appointments").delete().in("customer_id", ids);
    await svc.from("customers").delete().in("id", ids);
  }
  await cleanup();
  const left = await svc.from("appointments").select("id", { count: "exact", head: true });
  const leftC = await svc.from("customers").select("id", { count: "exact", head: true });
  console.log(`\nResultado: ${pass} OK, ${fail} fallos. Quedan en BD: ${left.count} citas, ${leftC.count} clientes`);
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error("ERROR", e);
  try { await cleanup(); } catch {}
  process.exit(2);
});
