#!/usr/bin/env node
/**
 * Utilidad de base de datos (Supabase) para este repo.
 *
 *   npm run db:push     → aplica las migraciones pendientes de supabase/migrations
 *   npm run db:seed     → aplica migraciones pendientes y ejecuta supabase/seed.sql
 *   npm run db:types    → regenera src/types/database.ts desde la base de datos
 *   npm run db:status   → muestra qué migraciones faltan (simulación, no cambia nada)
 *
 * Lee SUPABASE_PROJECT_REF y SUPABASE_DB_PASSWORD de .env.local y se conecta por el
 * "session pooler" de Supabase (el host directo db.<ref>.supabase.co es solo IPv6 y
 * falla en muchas redes). Si tu proyecto está en otra región, define en .env.local:
 *   SUPABASE_POOLER_HOST=aws-0-<region>.pooler.supabase.com
 * La contraseña nunca se imprime.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "node_modules", "supabase", "dist", "supabase.js");

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function loadEnv() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) fail("No existe .env.local. Copia .env.example y rellénalo (ver docs/00-nuevo-equipo.md).");
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const ref = env.SUPABASE_PROJECT_REF;
const password = env.SUPABASE_DB_PASSWORD;
const host = env.SUPABASE_POOLER_HOST || "aws-0-us-east-1.pooler.supabase.com";
if (!ref || !password) fail("Faltan SUPABASE_PROJECT_REF o SUPABASE_DB_PASSWORD en .env.local.");
if (!fs.existsSync(cli)) fail("Falta la CLI de Supabase. Ejecuta `npm install`.");

const dbUrl = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:5432/postgres`;

function run(args, { capture = false } = {}) {
  // Se invoca el JS de la CLI con el mismo Node: evita shells y problemas de escape en Windows.
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
  });
}

const action = process.argv[2];

switch (action) {
  case "push": {
    const r = run(["db", "push", "--db-url", dbUrl, "--yes"]);
    process.exit(r.status ?? 1);
    break;
  }
  case "seed": {
    const r = run(["db", "push", "--db-url", dbUrl, "--include-seed", "--yes"]);
    process.exit(r.status ?? 1);
    break;
  }
  case "status": {
    const r = run(["db", "push", "--db-url", dbUrl, "--dry-run"]);
    process.exit(r.status ?? 1);
    break;
  }
  case "types": {
    const r = run(["gen", "types", "typescript", "--db-url", dbUrl, "--schema", "public"], { capture: true });
    if (r.status !== 0 || !r.stdout) fail("No se pudieron generar los tipos.");
    fs.writeFileSync(path.join(root, "src", "types", "database.ts"), r.stdout);
    console.log("✔ src/types/database.ts actualizado");
    break;
  }
  default:
    fail("Uso: node scripts/db.mjs <push|seed|status|types>");
}
