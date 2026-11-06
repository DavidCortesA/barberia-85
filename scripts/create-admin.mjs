#!/usr/bin/env node
/**
 * Crea (o promueve) el usuario administrador del panel.
 *   npm run admin:create
 *
 * Pide el correo y la contraseña por consola (la contraseña no se muestra ni se
 * guarda en ningún archivo). Usa SUPABASE_SECRET_KEY de .env.local.
 *   · Si el correo no existe: crea el usuario ya confirmado y le da rol admin.
 *   · Si ya existe: solo le da rol admin (la contraseña no cambia).
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { createClient } = require("@supabase/supabase-js");

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const envFile = path.join(root, ".env.local");
if (!fs.existsSync(envFile)) fail("No existe .env.local.");
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) fail("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.");

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Oculta lo que se escribe (muestra * por cada carácter).
      rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? s : s.replace(/[^\r\n]/g, "*"));
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function findUserByEmail(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`No se pudo consultar usuarios: ${error.message}`);
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 200) return null;
  }
  return null;
}

const email = (await ask("Correo del administrador: ")).toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Correo inválido.");

let user = await findUserByEmail(email);
if (user) {
  console.log("• El usuario ya existe: solo se le dará rol de administrador.");
} else {
  const password = await ask("Contraseña (mínimo 12 caracteres): ", { hidden: true });
  if (password.length < 12) fail("La contraseña debe tener al menos 12 caracteres.");
  const again = await ask("Repite la contraseña: ", { hidden: true });
  if (again !== password) fail("Las contraseñas no coinciden.");
  const name = await ask("Nombre para mostrar (opcional): ");

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : undefined,
  });
  if (error) fail(`No se pudo crear el usuario: ${error.message}`);
  user = data.user;
  console.log("✔ Usuario creado.");
}

// El trigger de Auth crea el perfil con rol staff; aquí se asciende a admin.
const { data: profile, error } = await db
  .from("profiles")
  .upsert({ id: user.id, role: "admin" }, { onConflict: "id" })
  .select("role")
  .single();
if (error || profile?.role !== "admin") fail(`No se pudo asignar el rol admin: ${error?.message ?? "desconocido"}`);

console.log(`✔ ${email} ya es administrador. Inicia sesión en /login.`);
