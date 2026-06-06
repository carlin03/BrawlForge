/**
 * Publica el 100% del catálogo BrawlForge a Supabase:
 * BSC fantasy + tier B+ descubierto + partidos 2026 + jugadores.
 *
 *   npm run data:publish:100
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";
import { loadEnv, root } from "./lib/load-env.mjs";
import { upsert } from "./lib/supabase-rest.mjs";

loadEnv();

const gen = resolve(root, "src/lib/data/generated");
const syncedAt = new Date().toISOString();

function runStep(label, cmd, args) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    throw new Error(`${label} falló (código ${r.status})`);
  }
}

function matchToRow(m) {
  const meta = { schedule_trust: "confirmed", ...(m.meta || {}) };
  return {
    id: m.id,
    tournament_slug: m.tournamentSlug,
    team_a_slug: m.teamASlug,
    team_b_slug: m.teamBSlug,
    scheduled_at: m.date,
    status: m.status || "upcoming",
    stage: m.stage || null,
    region: m.region || null,
    format: m.format || "Bo3",
    score_a: m.scoreA ?? 0,
    score_b: m.scoreB ?? 0,
    published: true,
    meta,
    synced_at: syncedAt,
    updated_at: syncedAt,
  };
}

function playerToRow(p) {
  const status = String(p.status || "active").toLowerCase();
  return {
    slug: p.slug,
    ign: p.ign,
    team_slug: p.teamSlug || null,
    region: p.region || "GLOBAL",
    role: p.role || "Player",
    status: status === "retired" ? "retired" : status === "inactive" ? "inactive" : "active",
    fantasy_points: p.fantasyPoints ?? null,
    fantasy_ownership: p.fantasyOwnership ?? null,
    rating: p.rating ?? null,
    meta: {
      liquipedia_page: p.liquipediaPage || null,
      source: "players-2026",
    },
    synced_at: syncedAt,
  };
}

function dedupeById(rows) {
  const map = new Map();
  for (const row of rows) map.set(row.id, row);
  return [...map.values()];
}

async function seedMatches() {
  const matches = JSON.parse(readFileSync(resolve(gen, "matches-2026.json"), "utf8"));
  const rows = dedupeById(matches.map(matchToRow));
  console.log(`\n▶ Partidos tier B+ → matches_catalog (${rows.length})`);
  const n = await upsert("matches_catalog", rows);
  console.log(`  Subidos: ${n} partidos`);
  return n;
}

async function seedPlayers() {
  const players = JSON.parse(readFileSync(resolve(gen, "players-2026.json"), "utf8"));
  const rows = players.map(playerToRow);
  console.log(`\n▶ Jugadores 2026 → players_catalog (${rows.length})`);
  const n = await upsert("players_catalog", rows);
  console.log(`  Subidos: ${n} jugadores`);
  return n;
}

console.log("═══════════════════════════════════════════");
console.log(" BrawlForge — publicación 100% a Supabase");
console.log("═══════════════════════════════════════════");

runStep("Catálogo BSC (equipos, jugadores, torneos fantasy)", "npm", ["run", "supabase:seed:catalog"]);
runStep("Tier B+ descubierto (equipos + torneos Liquipedia)", "npm", ["run", "supabase:seed:discovered"]);

const matchesN = await seedMatches();
const playersN = await seedPlayers();

try {
  runStep("Exportar CSVs de respaldo", "npm", ["run", "supabase:export:csv"]);
} catch {
  console.warn("  (export CSV opcional — continuando)");
}

console.log("\n═══════════════════════════════════════════");
console.log(" Publicación Supabase completada");
console.log(`  Partidos:   ${matchesN}`);
console.log(`  Jugadores:  ${playersN}`);
console.log("═══════════════════════════════════════════");
