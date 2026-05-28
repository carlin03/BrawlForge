#!/usr/bin/env node
/**
 * Comprueba Supabase: auth, tablas y funciones RPC.
 * Uso: npm run supabase:check
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
      if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    console.error("No se encontró .env.local en", envPath);
    process.exit(1);
  }
}

const TABLES = [
  "profiles",
  "prediction_votes",
  "fantasy_entries",
  "fantasy_squad_slots",
  "teams_catalog",
  "players_catalog",
];

const RPCS = ["prediction_vote_aggregates", "fantasy_leaderboard"];

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
let failed = false;

const health = await fetch(`${url}/auth/v1/health`, { headers });
console.log("Auth:", health.ok ? "OK" : `ERROR ${health.status}`);
if (!health.ok) failed = true;

for (const table of TABLES) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, { headers });
  const ok = res.ok || res.status === 200;
  const missing = res.status === 404 || (await res.clone().json().catch(() => ({})))?.code === "42P01";
  if (ok) {
    console.log(`Tabla ${table}: OK`);
  } else if (missing) {
    console.log(`Tabla ${table}: FALTA`);
    failed = true;
  } else {
    const body = await res.json().catch(() => ({}));
    console.log(`Tabla ${table}:`, body.message ?? res.status);
    if (!res.ok) failed = true;
  }
}

for (const fn of RPCS) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: fn === "fantasy_leaderboard" ? JSON.stringify({ p_tournament: "bsc-2026-brawl-cup", p_limit: 1 }) : "{}",
  });
  if (res.ok) {
    console.log(`RPC ${fn}: OK`);
  } else {
    const body = await res.json().catch(() => ({}));
    console.log(`RPC ${fn}:`, body.message ?? res.status);
    failed = true;
  }
}

console.log("\nProyecto:", url.replace("https://", "").replace(".supabase.co", ""));

if (failed) {
  console.log("\n→ Ejecuta TODO supabase/ALL_IN_ONE_SETUP.sql en SQL Editor (un solo pegado + Run).");
  console.log("→ O desde GitHub: raw.githubusercontent.com/carlin03/BrawlForge/main/supabase/ALL_IN_ONE_SETUP.sql");
  process.exit(1);
}

console.log("\nSupabase listo para BrawlForge.");
