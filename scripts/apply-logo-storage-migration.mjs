#!/usr/bin/env node
/**
 * Aplica bucket + políticas de Storage para logos (migración 20260529500000).
 * Uso: npm run supabase:apply:storage
 * Requiere SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const k = t.slice(0, i);
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  } catch {
    console.error("Falta .env.local");
    process.exit(1);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) {
  console.error("No se pudo listar buckets:", listErr.message);
  process.exit(1);
}

const hasLogos = buckets?.some((b) => b.id === "logos" || b.name === "logos");
if (!hasLogos) {
  const { error: createErr } = await supabase.storage.createBucket("logos", {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  });
  if (createErr) {
    console.error("createBucket logos:", createErr.message);
    console.error("\nEjecuta en Supabase SQL Editor: supabase/migrations/20260529500000_logo_storage.sql");
    process.exit(1);
  }
  console.log("Bucket logos creado.");
} else {
  console.log("Bucket logos ya existe.");
}

console.log(
  "\nPolíticas RLS de storage: ejecuta en SQL Editor si el admin no puede subir logos:\n  supabase/migrations/20260529500000_logo_storage.sql\n  (o la sección 6 de supabase/ALL_IN_ONE_SETUP.sql)",
);
