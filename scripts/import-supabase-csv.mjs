/**
 * Importa CSV a Supabase (teams, players, news).
 *
 * Coloca archivos en data/import/:
 *   teams.csv, players.csv, news.csv
 *
 * Uso:
 *   npm run supabase:export:csv     # genera plantillas desde el repo
 *   npm run supabase:import:csv     # sube CSV → Supabase
 *   npm run supabase:import:csv -- --only=teams
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { csvToObjects, rowsToTeams, rowsToPlayers, rowsToNews } from "./lib/catalog-csv.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const importDir = resolve(root, "data", "import");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.split("=")[1] : "all";

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  console.error("La service role key está en Supabase → Settings → API");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=minimal",
};

async function upsert(table, rows, chunk = 80) {
  if (!rows.length) return 0;
  let n = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = rows.slice(i, i + chunk);
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${table}: ${res.status} ${text}`);
    }
    n += batch.length;
  }
  return n;
}

function readCsv(name) {
  const path = resolve(importDir, name);
  if (!existsSync(path)) {
    console.warn(`  (omitido) no existe ${path}`);
    return [];
  }
  return csvToObjects(readFileSync(path, "utf8"));
}

const syncedAt = new Date().toISOString();
const summary = {};

if (only === "all" || only === "teams") {
  const teamRows = rowsToTeams(readCsv("teams.csv"), syncedAt);
  console.log(`Equipos CSV → ${teamRows.length} filas`);
  summary.teams = await upsert("teams_catalog", teamRows);
}

if (only === "all" || only === "players") {
  let playerRows = rowsToPlayers(readCsv("players.csv"), syncedAt);
  try {
    await upsert("players_catalog", playerRows);
    summary.players = playerRows.length;
  } catch (e) {
    if (String(e.message).includes("photo_url")) {
      playerRows = playerRows.map(({ photo_url, ...rest }) => ({
        ...rest,
        meta: photo_url ? { photo_url } : rest.meta,
      }));
      summary.players = await upsert("players_catalog", playerRows);
    } else throw e;
  }
  console.log(`Jugadores CSV → ${summary.players ?? 0} filas`);
}

if (only === "all" || only === "news") {
  const newsRows = rowsToNews(readCsv("news.csv"), syncedAt);
  console.log(`Noticias CSV → ${newsRows.length} filas`);
  summary.news = await upsert("news_catalog", newsRows);
}

console.log("\nImportación completada:", summary);
console.log("Revisa en Supabase → Table Editor: teams_catalog, players_catalog, news_catalog");
