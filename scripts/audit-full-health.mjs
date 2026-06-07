/**
 * Auditoría integral: equipos sin partido, huérfanos DB, rosters, jugadores.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load-env.mjs";
import { loadPlayedTeamSlugs } from "./lib/played-team-slugs.mjs";
import { getSupabaseRest } from "./lib/supabase-rest.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");
loadEnv();

async function fetchAll(table, select, extra = "") {
  const { url, headers } = getSupabaseRest();
  const rows = [];
  let offset = 0;
  const order =
    table === "matches_catalog"
      ? "id"
      : table === "tournament_team_rosters"
        ? "tournament_slug"
        : "slug";
  while (true) {
    const q = `${url}/rest/v1/${table}?select=${select}${extra ? `&${extra}` : ""}&order=${order}&limit=1000&offset=${offset}`;
    const res = await fetch(q, { headers });
    if (!res.ok) throw new Error(`${table}: ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

function loadActiveSlugs() {
  const text = readFileSync(resolve(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
  const active = [...text.match(/BSC_2026_ACTIVE_TEAM_SLUGS[^[]*\[([\s\S]*?)\]\s*as const/)?.[1].matchAll(/"([a-z][a-z0-9-]*)"/g)].map((m) => m[1]);
  const excluded = new Set(
    [...(text.match(/BSC_2026_EXCLUDED[^[]*\[([\s\S]*?)\]/m)?.[1] ?? "").matchAll(/"([a-z][a-z0-9-]*)"/g)].map((m) => m[1]),
  );
  return active.filter((s) => !excluded.has(s));
}

function loadRosterSlugs() {
  const text = readFileSync(resolve(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
  const rosters = new Set();
  for (const m of text.matchAll(/^\s*"?([a-z0-9-]+)"?\s*:\s*\[/gm)) rosters.add(m[1]);
  return rosters;
}

const { played, matchCount } = loadPlayedTeamSlugs();
const discovered = JSON.parse(readFileSync(resolve(gen, "teams-discovered.json"), "utf8"));
const teams2026 = JSON.parse(readFileSync(resolve(gen, "teams-2026.json"), "utf8"));
const players2026 = JSON.parse(readFileSync(resolve(gen, "players-2026.json"), "utf8"));
const activeSlugs = loadActiveSlugs();
const rosterSlugs = loadRosterSlugs();
const excludedInRosters = [...rosterSlugs].filter((s) => !activeSlugs.includes(s));

const dbTeams = await fetchAll("teams_catalog", "slug,name,circuit_status");
const dbMatches = await fetchAll("matches_catalog", "id,team_a_slug,team_b_slug,published", "published=eq.true");
const dbPlayers = await fetchAll("players_catalog", "slug,ign,team_slug,status");
const dbRosters = await fetchAll("tournament_team_rosters", "tournament_slug,team_slug");

const matchTeams = new Set();
for (const m of dbMatches) {
  matchTeams.add(m.team_a_slug);
  matchTeams.add(m.team_b_slug);
}

const dbTeamsNoMatch = dbTeams.filter((t) => !matchTeams.has(t.slug));
const discoveredNoMatch = discovered.filter((t) => !played.has(t.slug));
const activeNoMatch = activeSlugs.filter((s) => !played.has(s));
const activeNoRoster = activeSlugs.filter((s) => !rosterSlugs.has(s));

const rosterOrphans = dbRosters.filter((r) => !dbTeams.some((t) => t.slug === r.team_slug));
const rosterOrphanSlugs = [...new Set(rosterOrphans.map((r) => r.team_slug))];

const playerTeams = new Map();
for (const p of dbPlayers) {
  if (!p.team_slug) continue;
  if (!playerTeams.has(p.team_slug)) playerTeams.set(p.team_slug, []);
  playerTeams.get(p.team_slug).push(p.slug);
}
const playersOnMissingTeams = [...playerTeams.entries()].filter(([slug]) => !dbTeams.some((t) => t.slug === slug));

const multiTeam = new Map();
for (const p of players2026) {
  if (!p.teamSlug) continue;
  if (!multiTeam.has(p.slug)) multiTeam.set(p.slug, new Set());
  multiTeam.get(p.slug).add(p.teamSlug);
}
const localMulti = [...multiTeam.entries()].filter(([, teams]) => teams.size > 1);

console.log("═══ AUDITORÍA INTEGRAL ═══\n");
console.log(`Partidos publicables (pool): ${matchCount}`);
console.log(`Equipos con partido (pool):  ${played.size}`);
console.log(`teams-discovered:            ${discovered.length}`);
console.log(`BSC activos:                 ${activeSlugs.length}`);
console.log(`BSC teams-2026.json:         ${teams2026.length}`);
console.log(`Jugadores BSC local:         ${players2026.length}`);
console.log(`\n── Supabase ──`);
console.log(`teams_catalog:               ${dbTeams.length}`);
console.log(`matches_catalog (published): ${dbMatches.length}`);
console.log(`players_catalog:             ${dbPlayers.length}`);
console.log(`tournament_team_rosters:     ${dbRosters.length}`);

console.log(`\n── Equipos sin partido ──`);
console.log(`DB teams_catalog sin partido:  ${dbTeamsNoMatch.length}`);
if (dbTeamsNoMatch.length) console.log(`  → ${dbTeamsNoMatch.map((t) => t.slug).join(", ")}`);
console.log(`discovered sin partido:      ${discoveredNoMatch.length}`);
console.log(`BSC activos sin partido:     ${activeNoMatch.length}`);
if (activeNoMatch.length) console.log(`  → ${activeNoMatch.join(", ")}`);

console.log(`\n── Rosters BSC ──`);
console.log(`Activos sin entrada rosters: ${activeNoRoster.length}`);
if (activeNoRoster.length) console.log(`  → ${activeNoRoster.join(", ")}`);
console.log(`Rosters de equipos excluidos: ${excludedInRosters.length}`);
if (excludedInRosters.length) console.log(`  → ${excludedInRosters.join(", ")}`);
console.log(`Plantillas torneo huérfanas: ${rosterOrphanSlugs.length}`);
if (rosterOrphanSlugs.length) console.log(`  → ${rosterOrphanSlugs.join(", ")}`);

console.log(`\n── Jugadores ──`);
console.log(`Multi-equipo local BSC:      ${localMulti.length}`);
console.log(`Jugadores en equipos ausentes DB: ${playersOnMissingTeams.length}`);

const ok =
  dbTeamsNoMatch.length === 0 &&
  discoveredNoMatch.length === 0 &&
  activeNoMatch.length === 0 &&
  rosterOrphanSlugs.length === 0 &&
  localMulti.length === 0;

console.log(`\n═══ VEREDICTO: ${ok ? "OK" : "HAY PROBLEMAS"} ═══`);
process.exit(ok ? 0 : 1);
