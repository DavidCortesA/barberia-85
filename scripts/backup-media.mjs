#!/usr/bin/env node
/**
 * Descarga todas las fotos del bucket "media" (Supabase Storage) a una carpeta.
 * pg_dump respalda la base, pero NO los archivos: este script cubre las fotos.
 *
 *   node scripts/backup-media.mjs <carpeta-destino>
 *
 * Variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (del entorno o de
 * .env.local). Sin dependencias: solo fetch, para correr en GitHub Actions sin
 * instalar node_modules.
 */
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const file = path.resolve(".env.local");
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}

const fileEnv = loadEnv();
const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SECRET_KEY || fileEnv.SUPABASE_SECRET_KEY;
const outDir = process.argv[2];
if (!base || !key || !outDir) {
  console.error("Uso: node scripts/backup-media.mjs <carpeta>  (requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY)");
  process.exit(1);
}

const BUCKET = "media";
const headers = { apikey: key, Authorization: `Bearer ${key}` };

/** Lista un "directorio" del bucket; las carpetas vienen con id null. */
async function list(prefix) {
  const items = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${base}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`No se pudo listar "${prefix}": ${res.status}`);
    const page = await res.json();
    items.push(...page);
    if (page.length < 1000) return items;
  }
}

async function walk(prefix, files) {
  for (const item of await list(prefix)) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) await walk(full, files);
    else files.push(full);
  }
  return files;
}

const files = await walk("", []);
let bytes = 0;
for (const file of files) {
  const res = await fetch(`${base}/storage/v1/object/${BUCKET}/${file.split("/").map(encodeURIComponent).join("/")}`, { headers });
  if (!res.ok) throw new Error(`No se pudo descargar ${file}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(outDir, BUCKET, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  bytes += buf.length;
}
console.log(`✔ ${files.length} archivos del bucket "${BUCKET}" (${(bytes / 1024 / 1024).toFixed(1)} MB) en ${outDir}`);
