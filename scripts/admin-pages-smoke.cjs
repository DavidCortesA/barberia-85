/**
 * Prueba de humo HTTP del panel (requiere el servidor corriendo: npm run dev o npm start).
 *   npm run test:pages            → http://localhost:3000
 *   BASE_URL=https://… npm run test:pages
 *
 * Crea usuarios temporales (staff y admin) con contraseñas aleatorias que nunca
 * se imprimen, obtiene su cookie de sesión igual que el navegador (@supabase/ssr)
 * y comprueba: anónimo → /login; recepción (staff) → sus pantallas y la API del
 * calendario, y las de administración la regresan a /admin; admin → todas.
 * Al final borra los usuarios.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createRequire } = require("module");

const ROOT = path.resolve(__dirname, "..");
const req = createRequire(path.join(ROOT, "package.json"));
const { createClient } = req("@supabase/supabase-js");
const { createServerClient } = req("@supabase/ssr");

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const BASE = process.env.BASE_URL || "http://localhost:3000";
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const RUN = crypto.randomBytes(4).toString("hex");
const users = [];

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  cond ? pass++ : fail++;
  console.log((cond ? "PASS" : "FAIL") + "  " + name + (extra ? "  -> " + extra : ""));
};

async function sessionCookie(role) {
  const email = `prueba-web-${role}-${RUN}@barberia85.test`;
  const password = crypto.randomBytes(24).toString("base64url");
  const created = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw new Error(created.error.message);
  users.push(created.data.user.id);
  if (role === "admin") await svc.from("profiles").update({ role: "admin" }).eq("id", created.data.user.id);

  const jar = new Map();
  const client = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

const get = (p, cookie) => fetch(BASE + p, { redirect: "manual", headers: cookie ? { cookie } : {} });

const ADMIN_PAGES = [
  ["/admin", "Inicio"],
  ["/admin/appointments", "Citas"],
  ["/admin/appointments?estado=pending&ver=all", "Citas"],
  ["/admin/calendar", "Calendario"],
  ["/admin/services", "Servicios"],
  ["/admin/barbers", "Barberos"],
  ["/admin/schedule", "Horarios"],
  ["/admin/settings", "Configuración"],
  ["/admin/content", "Contenido"],
  ["/admin/users", "Usuarios"],
];
const STAFF_PAGES = ["/admin", "/admin/appointments", "/admin/calendar", "/admin/schedule"];
/** Pantallas solo de admin y un texto que solo aparece si la página se renderizó. */
const ADMIN_ONLY = [
  ["/admin/services", "Nuevo servicio"],
  ["/admin/barbers", "Agregar barbero"],
  ["/admin/settings", "Reglas de reserva"],
  ["/admin/content", "Textos y fotos del sitio público"],
  ["/admin/users", "Nueva cuenta"],
];

(async () => {
  // Anónimo
  let r = await get("/admin");
  ok("anónimo en /admin → /login", r.status === 307 && (r.headers.get("location") || "").includes("/login"), `${r.status}`);
  r = await get("/login");
  ok("/login responde", r.status === 200, `${r.status}`);

  // Recepción (staff)
  const staff = await sessionCookie("staff");
  for (const p of STAFF_PAGES) {
    const res = await get(p, staff);
    const html = res.status === 200 ? await res.text() : "";
    ok(`recepción ${p}`, res.status === 200 && !html.includes("No se pudo cargar esta sección"), `${res.status}`);
  }
  // Con loading.tsx la página ya va en streaming: el redirect llega como 200 con
  // instrucción de redirección para el cliente. Lo importante: no hay contenido.
  for (const [p, marker] of ADMIN_ONLY) {
    const res = await get(p, staff);
    const html = res.status === 200 ? await res.text() : "";
    const redirected =
      (res.status === 307 && (res.headers.get("location") || "").includes("aviso=sin-permiso")) ||
      (res.status === 200 && html.includes("aviso=sin-permiso") && !html.includes(marker));
    ok(`recepción NO entra a ${p} (→ /admin, sin contenido)`, redirected, `${res.status}`);
  }
  r = await get("/admin/schedule", staff);
  const scheduleHtml = await r.text();
  ok("recepción ve horarios sin editor semanal", scheduleHtml.includes("Solo la administración puede cambiarlo") && !scheduleHtml.includes("Guardar horario"));
  r = await get("/api/admin/calendar?from=2026-11-01&to=2026-11-08", staff);
  ok("recepción usa la API del calendario", r.status === 200, `${r.status}`);
  r = await get("/login", staff);
  ok("recepción en /login → /admin", r.status === 307, `${r.status}`);

  // Admin
  const admin = await sessionCookie("admin");
  for (const [p, heading] of ADMIN_PAGES) {
    const res = await get(p, admin);
    const html = res.status === 200 ? await res.text() : "";
    ok(`admin ${p}`, res.status === 200 && html.includes(heading) && !html.includes("No se pudo cargar esta sección"), `${res.status}`);
  }
  r = await get("/login", admin);
  ok("admin en /login → /admin", r.status === 307 && (r.headers.get("location") || "").endsWith("/admin"), `${r.status}`);
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  r = await get(`/api/admin/calendar?from=${today}&to=${in7}`, admin);
  const json = r.status === 200 ? await r.json() : null;
  ok("admin usa la API del calendario", !!json && Array.isArray(json.appointments) && Array.isArray(json.blocks), `${r.status}`);
  r = await get(`/api/admin/calendar?from=${today}&to=2030-01-01`, admin);
  ok("API del calendario rechaza rangos enormes", r.status === 400, `${r.status}`);

  for (const id of users) await svc.auth.admin.deleteUser(id);
  console.log(`\nResultado: ${pass} OK, ${fail} fallos.`);
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error("ERROR", e.message ?? e);
  for (const id of users) await svc.auth.admin.deleteUser(id).catch(() => {});
  process.exit(2);
});
