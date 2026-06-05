/**
 * Restaura un equipo en teams_catalog desde bsc-catalog-seed.json
 * Uso: node scripts/restore-team.mjs natus-vincere
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const slug = (process.argv[2] || "").trim().toLowerCase();
if (!slug) {
  console.error("Uso: node scripts/restore-team.mjs <slug>");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const seed = JSON.parse(
  readFileSync(resolve(root, "src/lib/data/generated/bsc-catalog-seed.json"), "utf8"),
);
const team = seed.teams.find((t) => t.slug === slug);
if (!team) {
  console.error(`No hay datos de "${slug}" en bsc-catalog-seed.json`);
  process.exit(1);
}

team.synced_at = new Date().toISOString();

const res = await fetch(`${url}/rest/v1/teams_catalog`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify([team]),
});

const text = await res.text();
if (!res.ok) {
  console.error("Error Supabase:", res.status, text);
  process.exit(1);
}

const row = JSON.parse(text)[0];
console.log(`OK — restaurado ${row.name} (${row.slug}) en teams_catalog`);
