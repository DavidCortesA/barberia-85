#!/usr/bin/env node
/**
 * Sube las fotos de ejemplo (supabase/seed-media) al bucket "media" y las
 * asigna al sitio: portada, "Nosotros", fondos de "Cómo reservar" y galería.
 *   npm run db:seed-media
 *
 * Idempotente y respetuoso: solo llena lo que esté VACÍO (no pisa fotos que
 * el admin ya haya puesto) y solo crea la galería si no tiene fotos.
 * Después todo se cambia o se quita desde el panel (Contenido).
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const dir = path.join(root, "supabase", "seed-media");
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));

async function upload(file, folder) {
  const objectPath = `${folder}/${randomUUID()}.jpg`;
  const { error } = await db.storage.from("media").upload(objectPath, fs.readFileSync(path.join(dir, file)), {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });
  if (error) throw new Error(`${file}: ${error.message}`);
  return db.storage.from("media").getPublicUrl(objectPath).data.publicUrl;
}

const { data: current, error: readErr } = await db.from("site_content").select("key, value");
if (readErr) throw readErr;
const saved = new Map(current.map((r) => [r.key, r.value]));

let set = 0;
for (const item of manifest.content) {
  if (saved.get(item.key)?.trim()) {
    console.log(`• ${item.key}: ya tiene foto, se deja igual`);
    continue;
  }
  const url = await upload(item.file, "content");
  const rows = [{ key: item.key, value: url }];
  if (item.altKey && !saved.get(item.altKey)?.trim()) rows.push({ key: item.altKey, value: item.alt });
  const { error } = await db.from("site_content").upsert(rows, { onConflict: "key" });
  if (error) throw error;
  set++;
  console.log(`✔ ${item.key}`);
}

const { count } = await db.from("gallery_images").select("id", { count: "exact", head: true });
if ((count ?? 0) > 0) {
  console.log(`• galería: ya tiene ${count} fotos, se deja igual`);
} else {
  const rows = [];
  for (const [i, item] of manifest.gallery.entries()) {
    rows.push({ image_url: await upload(item.file, "gallery"), alt: item.alt, sort_order: (i + 1) * 10, is_active: true });
  }
  const { error } = await db.from("gallery_images").insert(rows);
  if (error) throw error;
  console.log(`✔ galería: ${rows.length} fotos`);
}

console.log(`\nListo (${set} fotos de contenido). El sitio se actualiza en máximo 60 s o al guardar desde el panel.`);
