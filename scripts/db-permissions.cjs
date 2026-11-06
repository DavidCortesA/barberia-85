/**
 * Matriz de permisos y flujos del panel contra la base de datos REAL (Supabase).
 *   npm run test:db   (corre después de db-smoke.cjs)
 *
 * Crea DOS usuarios temporales (rol staff y rol admin) con contraseñas aleatorias
 * que nunca se imprimen, inicia sesión con cada uno usando la clave publishable
 * (igual que el navegador) y comprueba lectura/escritura sobre cada tabla y
 * función, Storage y las transiciones de citas que usa el panel. Al terminar
 * borra los usuarios y todos los datos de prueba (teléfonos +52550000020X).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createRequire } = require("module");

const ROOT = path.resolve(__dirname, "..");
const req = createRequire(path.join(ROOT, "package.json"));
const { createClient } = req("@supabase/supabase-js");

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const svc = createClient(url, env.SUPABASE_SECRET_KEY, opts);
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, opts);

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  cond ? pass++ : fail++;
  console.log((cond ? "PASS" : "FAIL") + "  " + name + (extra ? "  -> " + extra : ""));
};
/** Una escritura está "denegada" si falla o no afecta ninguna fila (RLS filtra en silencio). */
const denied = (r) => !!r.error || (Array.isArray(r.data) && r.data.length === 0);
const allowed = (r) => !r.error && (!Array.isArray(r.data) || r.data.length > 0);

const PHONES = ["+525500000201", "+525500000202"];
const RUN = crypto.randomBytes(4).toString("hex");
const users = {};

function nextWeekday(dow, minDays = 3) {
  const base = new Date(Date.now() - 6 * 3600e3 + minDays * 86400e3);
  while (base.getUTCDay() !== dow) base.setUTCDate(base.getUTCDate() + 1);
  return base.toISOString().slice(0, 10);
}
const at = (d, hm) => `${d}T${hm}:00-06:00`;

async function makeUser(role) {
  const email = `prueba-${role}-${RUN}@barberia85.test`;
  const password = crypto.randomBytes(24).toString("base64url");
  const created = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw new Error(`No se pudo crear el usuario ${role}: ${created.error.message}`);
  const id = created.data.user.id;
  users[role] = id;
  if (role === "admin") {
    const p = await svc.from("profiles").update({ role: "admin" }).eq("id", id);
    if (p.error) throw new Error(`No se pudo promover a admin: ${p.error.message}`);
  }
  const client = createClient(url, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, opts);
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error) throw new Error(`No se pudo iniciar sesión como ${role}: ${signed.error.message}`);
  return { client, id };
}

async function cleanup() {
  const cs = await svc.from("customers").select("id").in("phone", PHONES);
  const ids = (cs.data || []).map((c) => c.id);
  if (ids.length) {
    await svc.from("appointments").delete().in("customer_id", ids);
    await svc.from("customers").delete().in("id", ids);
  }
  await svc.from("blocked_slots").delete().eq("reason", "prueba-permisos");
  await svc.from("schedule_exceptions").delete().eq("note", "prueba-permisos");
  await svc.from("barbers").delete().eq("name", "Prueba Permisos");
  await svc.from("site_content").delete().eq("key", "zz.prueba_permisos");
  await svc.from("gallery_images").delete().eq("alt", "prueba-permisos");
  for (const id of Object.values(users)) await svc.auth.admin.deleteUser(id);
}

const PUBLIC_READ = ["business_settings", "services", "barbers", "barber_hours", "business_hours", "schedule_exceptions", "site_content", "gallery_images"];
const PRIVATE = ["customers", "appointments", "blocked_slots", "appointment_events"];
const SERVICE_ONLY_RPC = {
  create_appointment_request: { p_service_id: "00000000-0000-0000-0000-000000000000", p_starts_at: new Date().toISOString(), p_full_name: "x", p_phone: "+525500000299" },
  get_busy_intervals: { p_from: new Date().toISOString(), p_to: new Date(Date.now() + 864e5).toISOString() },
  expire_stale_pending: {},
  slot_within_business_hours: { p_start: new Date().toISOString(), p_end: new Date(Date.now() + 36e5).toISOString() },
};

(async () => {
  await cleanup();
  const staff = await makeUser("staff");
  const admin = await makeUser("admin");
  const roles = { anon: { client: anon }, staff, admin };

  // ------------------------------------------------------------------
  // 1. Lectura por tabla
  // ------------------------------------------------------------------
  for (const t of PUBLIC_READ) {
    for (const [role, { client }] of Object.entries(roles)) {
      const r = await client.from(t).select("*").limit(1);
      ok(`${role} lee ${t}`, !r.error, r.error?.code);
    }
  }
  // Seed mínimo para que las tablas privadas tengan filas que "esconder".
  const svcList = await svc.from("services").select("id").eq("is_active", true).order("sort_order").limit(1);
  const serviceId = svcList.data[0].id;
  const mon = nextWeekday(1), tue = nextWeekday(2);
  const seed = await svc.rpc("create_appointment_request", {
    p_service_id: serviceId, p_starts_at: at(mon, "10:30"), p_full_name: "Prueba Permisos", p_phone: PHONES[0],
  });
  ok("seed: solicitud de prueba creada", !seed.error, seed.error?.message);
  await svc.from("blocked_slots").insert({ start_datetime: at(tue, "09:00"), end_datetime: at(tue, "09:30"), reason: "prueba-permisos" });

  for (const t of PRIVATE) {
    for (const role of ["anon", "staff"]) {
      const r = await roles[role].client.from(t).select("*").limit(5);
      ok(`${role} NO lee ${t}`, !!r.error || r.data.length === 0, r.error ? r.error.code : `${r.data.length} filas`);
    }
    const r = await admin.client.from(t).select("*").limit(5);
    ok(`admin lee ${t}`, !r.error && r.data.length > 0, r.error?.code ?? `${r.data.length} filas`);
  }

  // profiles: anon nada; staff solo el suyo; admin todos.
  let r = await anon.from("profiles").select("id");
  ok("anon NO lee profiles", !!r.error || r.data.length === 0);
  r = await staff.client.from("profiles").select("id, role");
  ok("staff solo lee su propio perfil", !r.error && r.data.length === 1 && r.data[0].id === staff.id, `${r.data?.length} filas`);
  r = await admin.client.from("profiles").select("id");
  ok("admin lee todos los perfiles", !r.error && r.data.length >= 2, `${r.data?.length} filas`);
  r = await staff.client.from("profiles").update({ role: "admin" }).eq("id", staff.id).select();
  ok("staff NO puede ascenderse a admin", denied(r), r.error?.code ?? `${r.data?.length} filas`);

  // ------------------------------------------------------------------
  // 2. Escritura por tabla
  // ------------------------------------------------------------------
  const writes = {
    barbers: (c) => c.from("barbers").insert({ name: "Prueba Permisos" }).select(),
    schedule_exceptions: (c) => c.from("schedule_exceptions").insert({ exception_date: "2099-12-25", note: "prueba-permisos" }).select(),
    blocked_slots: (c) => c.from("blocked_slots").insert({ start_datetime: at(tue, "08:00"), end_datetime: at(tue, "08:30"), reason: "prueba-permisos" }).select(),
    site_content: (c) => c.from("site_content").insert({ key: "zz.prueba_permisos", value: "x" }).select(),
    gallery_images: (c) => c.from("gallery_images").insert({ image_url: "https://example.test/x.jpg", alt: "prueba-permisos", is_active: false }).select(),
    customers: (c) => c.from("customers").insert({ full_name: "Prueba Permisos", phone: PHONES[1] }).select(),
  };
  for (const [t, write] of Object.entries(writes)) {
    for (const role of ["anon", "staff"]) {
      const w = await write(roles[role].client);
      ok(`${role} NO inserta en ${t}`, denied(w), w.error?.code ?? "0 filas");
    }
    const w = await write(admin.client);
    ok(`admin inserta en ${t}`, allowed(w), w.error?.message);
  }
  const settings = await svc.from("business_settings").select("name").single();
  for (const role of ["anon", "staff"]) {
    const w = await roles[role].client.from("business_settings").update({ name: "Hackeado" }).eq("id", true).select();
    ok(`${role} NO modifica business_settings`, denied(w), w.error?.code ?? "0 filas");
    const s = await roles[role].client.from("services").update({ price: 1 }).eq("id", serviceId).select();
    ok(`${role} NO modifica services`, denied(s), s.error?.code ?? "0 filas");
    const a = await roles[role].client.from("appointments").update({ status: "confirmed" }).eq("id", seed.data.id).select();
    ok(`${role} NO confirma citas`, denied(a), a.error?.code ?? "0 filas");
  }
  let w = await admin.client.from("business_settings").update({ name: settings.data.name }).eq("id", true).select();
  ok("admin modifica business_settings", allowed(w), w.error?.message);

  // ------------------------------------------------------------------
  // 3. Funciones
  // ------------------------------------------------------------------
  for (const [fn, args] of Object.entries(SERVICE_ONLY_RPC)) {
    for (const [role, { client }] of Object.entries(roles)) {
      const x = await client.rpc(fn, args);
      ok(`${role} NO ejecuta ${fn}`, !!x.error, x.error?.code);
    }
  }
  const hours = await svc.from("business_hours").select("day_of_week, opening_time, closing_time, is_closed");
  const sameHours = hours.data.map((h) => ({
    day_of_week: h.day_of_week,
    opening_time: h.opening_time ? h.opening_time.slice(0, 5) : null,
    closing_time: h.closing_time ? h.closing_time.slice(0, 5) : null,
    is_closed: h.is_closed,
  }));
  let x = await anon.rpc("admin_replace_business_hours", { p_hours: sameHours });
  ok("anon NO ejecuta admin_replace_business_hours", !!x.error, x.error?.code);
  x = await staff.client.rpc("admin_replace_business_hours", { p_hours: sameHours });
  ok("staff NO ejecuta admin_replace_business_hours", !!x.error, x.error?.code);
  x = await admin.client.rpc("admin_replace_business_hours", {
    p_hours: [...sameHours, { day_of_week: 1, opening_time: "09:00", closing_time: "12:00", is_closed: false }],
  });
  const afterBad = await svc.from("business_hours").select("id", { count: "exact", head: true });
  ok("horario con traslape se rechaza y el anterior queda intacto (atómico)",
    x.error?.code === "23P01" && afterBad.count === hours.data.length, x.error?.code);
  x = await admin.client.rpc("admin_replace_business_hours", { p_hours: sameHours });
  const after = await svc.from("business_hours").select("id", { count: "exact", head: true });
  ok("admin reemplaza el horario semanal", !x.error && after.count === hours.data.length, x.error?.message);

  // Horario por barbero
  const barber = await svc.from("barbers").select("id").eq("name", "Prueba Permisos").single();
  const week = [
    { day_of_week: 1, opening_time: "10:00", closing_time: "14:00" },
    { day_of_week: 1, opening_time: "15:00", closing_time: "19:00" },
  ];
  for (const role of ["anon", "staff"]) {
    const y = await roles[role].client.rpc("admin_replace_barber_hours", { p_barber_id: barber.data.id, p_hours: week });
    ok(`${role} NO ejecuta admin_replace_barber_hours`, !!y.error, y.error?.code);
    const z = await roles[role].client.from("barber_hours").insert({ barber_id: barber.data.id, day_of_week: 2, opening_time: "10:00", closing_time: "12:00" }).select();
    ok(`${role} NO inserta en barber_hours`, denied(z), z.error?.code ?? "0 filas");
  }
  x = await admin.client.rpc("admin_replace_barber_hours", { p_barber_id: barber.data.id, p_hours: week });
  let bh = await svc.from("barber_hours").select("id").eq("barber_id", barber.data.id);
  ok("admin guarda el horario de un barbero (varios rangos)", !x.error && bh.data.length === 2, x.error?.message);
  x = await admin.client.rpc("admin_replace_barber_hours", {
    p_barber_id: barber.data.id, p_hours: [...week, { day_of_week: 1, opening_time: "13:00", closing_time: "16:00" }],
  });
  bh = await svc.from("barber_hours").select("id").eq("barber_id", barber.data.id);
  ok("horario de barbero con traslape se rechaza sin perder el anterior", x.error?.code === "23P01" && bh.data.length === 2, x.error?.code);

  // ------------------------------------------------------------------
  // 4. Storage (bucket media)
  // ------------------------------------------------------------------
  const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4bd0000000049454e44ae426082", "hex");
  const p = `content/prueba-${RUN}.png`;
  let st = await staff.client.storage.from("media").createSignedUploadUrl(p);
  const stUp = st.error ? st : await staff.client.storage.from("media").uploadToSignedUrl(p, st.data.token, png, { contentType: "image/png" });
  ok("staff NO sube a media", !!stUp.error, stUp.error?.message);
  st = await anon.storage.from("media").upload(p, png, { contentType: "image/png" });
  ok("anon NO sube a media", !!st.error, st.error?.message);
  st = await admin.client.storage.from("media").createSignedUploadUrl(p);
  ok("admin obtiene URL firmada de subida", !st.error, st.error?.message);
  if (!st.error) {
    const up = await anon.storage.from("media").uploadToSignedUrl(p, st.data.token, png, { contentType: "image/png" });
    ok("subida con URL firmada funciona", !up.error, up.error?.message);
    const big = await admin.client.storage.from("media").upload(`content/grande-${RUN}.png`, Buffer.alloc(5 * 1024 * 1024 + 10), { contentType: "image/png" });
    ok("bucket rechaza archivos > 5 MB", !!big.error, big.error?.message);
    const txt = await admin.client.storage.from("media").upload(`content/x-${RUN}.txt`, Buffer.from("hola"), { contentType: "text/plain" });
    ok("bucket rechaza archivos que no son imagen", !!txt.error, txt.error?.message);
    const delStaff = await staff.client.storage.from("media").remove([p]);
    const still = await svc.storage.from("media").list("content", { search: `prueba-${RUN}` });
    ok("staff NO borra de media", (still.data || []).length === 1, delStaff.error?.message);
    const del = await admin.client.storage.from("media").remove([p]);
    ok("admin borra de media", !del.error && del.data.length === 1, del.error?.message);
  }

  // ------------------------------------------------------------------
  // 5. Flujos del panel (como admin, con RLS)
  // ------------------------------------------------------------------
  const pending1 = seed.data;
  let c = await admin.client.from("appointments").update({ status: "confirmed" }).eq("id", pending1.id).select().single();
  ok("panel: confirmar pendiente", !c.error && c.data.status === "confirmed", c.error?.message);
  // Una segunda pendiente en el mismo horario (insertada directo: la RPC pública ya no la aceptaría).
  const cust2 = await svc.from("customers")
    .upsert({ full_name: "Prueba Dos", phone: PHONES[1] }, { onConflict: "phone" }).select().single();
  const p2 = await svc.from("appointments").insert({
    customer_id: cust2.data.id, service_id: serviceId, starts_at: pending1.starts_at, ends_at: pending1.ends_at,
    status: "pending", price_snapshot: pending1.price_snapshot, duration_snapshot: pending1.duration_snapshot,
  }).select().single();
  c = await admin.client.from("appointments").update({ status: "confirmed" }).eq("id", p2.data.id).select().single();
  ok("panel: confirmar con el hueco ocupado → 23P01", c.error?.code === "23P01", c.error?.code);
  const overlaps = await admin.client.from("appointments").select("id")
    .eq("status", "pending").neq("id", pending1.id).lt("starts_at", pending1.ends_at).gt("ends_at", pending1.starts_at);
  ok("panel: detecta pendientes traslapadas para ofrecer rechazarlas", (overlaps.data || []).some((o) => o.id === p2.data.id));
  c = await admin.client.from("appointments").update({ status: "rejected" }).in("id", [p2.data.id]).eq("status", "pending").select();
  ok("panel: rechazar traslapadas", !c.error && c.data.length === 1, c.error?.message);
  c = await admin.client.from("appointments").update({ status: "completed" }).eq("id", pending1.id);
  ok("panel: completar cita futura → too_early_to_complete", c.error?.message === "too_early_to_complete", c.error?.message);
  c = await admin.client.from("appointments").update({ status: "pending" }).eq("id", p2.data.id);
  ok("panel: transición inválida → invalid_status_transition", c.error?.message === "invalid_status_transition", c.error?.message);
  // Bloqueo encima de una pendiente → confirmar falla con slot_blocked.
  const p3 = await svc.rpc("create_appointment_request", {
    p_service_id: serviceId, p_starts_at: at(tue, "16:00"), p_full_name: "Prueba Dos", p_phone: PHONES[1],
  });
  await admin.client.from("blocked_slots").insert({ start_datetime: at(tue, "16:00"), end_datetime: at(tue, "17:00"), reason: "prueba-permisos" });
  c = await admin.client.from("appointments").update({ status: "confirmed" }).eq("id", p3.data.id);
  ok("panel: confirmar sobre un bloqueo → slot_blocked", c.error?.message === "slot_blocked", c.error?.message);
  c = await admin.client.from("appointments").update({ admin_notes: "nota de prueba" }).eq("id", p3.data.id).select().single();
  ok("panel: guardar notas internas", !c.error && c.data.admin_notes === "nota de prueba", c.error?.message);
  c = await admin.client.from("appointments").update({ status: "cancelled" }).eq("id", pending1.id).select().single();
  ok("panel: cancelar confirmada", !c.error && c.data.status === "cancelled", c.error?.message);
  const ev = await admin.client.from("appointment_events").select("actor, to_status").eq("appointment_id", pending1.id).order("created_at");
  ok("historial registra al admin como actor", !ev.error && ev.data.some((e) => e.actor === admin.id && e.to_status === "confirmed"),
    `${ev.data?.length} eventos`);
  const del = await admin.client.from("services").delete().eq("id", serviceId);
  ok("panel: eliminar servicio con citas → 23503", del.error?.code === "23503", del.error?.code);

  await cleanup();
  const leftUsers = await Promise.all(Object.values(users).map((id) => svc.auth.admin.getUserById(id)));
  ok("usuarios temporales eliminados", leftUsers.every((u) => !!u.error || !u.data.user));
  console.log(`\nResultado: ${pass} OK, ${fail} fallos.`);
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error("ERROR", e.message ?? e);
  try { await cleanup(); } catch {}
  process.exit(2);
});
