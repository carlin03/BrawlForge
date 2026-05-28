/**
 * Comprueba conexión a Supabase (lee brawlforge/.env.local vía dotenv manual).
 * Uso: node scripts/check-supabase.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {
    console.error("No se encontró .env.local en", envPath);
    process.exit(1);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

const health = await fetch(`${url}/auth/v1/health`, { headers });
console.log("Auth:", health.ok ? "OK" : `ERROR ${health.status}`);

const profiles = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, { headers });
const body = await profiles.json().catch(() => ({}));
if (profiles.ok) {
  console.log("Tabla profiles: OK");
} else {
  console.log("Tabla profiles:", body.message ?? profiles.status);
  console.log("\n→ Ejecuta supabase/migrations/20260528000000_initial.sql en SQL Editor");
  console.log("→ Usuarios: dashboard → Authentication → Users (no Table Editor)");
}

console.log("\nProyecto:", url.replace("https://", "").replace(".supabase.co", ""));
