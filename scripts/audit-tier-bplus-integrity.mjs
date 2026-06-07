/**
 * Auditoría cruzada: equipos tier B+ ↔ partidos ↔ torneos ↔ Supabase
 *   node scripts/audit-tier-bplus-integrity.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { loadEnv, root } from "./lib/load-env.mjs";

loadEnv();

const gen = resolve(root, "src/lib/data/generated");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_TIER = 3;
const BSC_RE = /^bsc-2026|^world-finals-2026|^brawl-stars-championship-/;

function load(name) {
  return JSON.parse(readFileSync(resolve(gen, name), "utf8"));
}

async function fetchAll(table, select = "*", pageSize = 1000) {
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=${select}&order=${table === "matches_catalog" ? "id" : "slug"}&limit=${pageSize}&offset=${offset}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

const matches = load("matches-2026.json");
const teamsDiscovered = load("teams-discovered.json");
const tours2026 = load("tournaments-2026.json");
const toursDiscovered = load("tournaments-discovered.json");
const bscSlugs = new Set();
try {
  const bscTs = readFileSync(resolve(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
  const block = bscTs.match(/BSC_2026_ACTIVE_TEAM_SLUGS[^[]*\[([\s\S]*?)\]/)?.[1] ?? "";
  for (const m of block.matchAll(/"([a-z0-9-]+)"/g)) bscSlugs.add(m[1]);
} catch {
  /* ignore */
}

const tierBPlusTourSlugs = new Set();
const tourTierBySlug = new Map();
for (const t of tours2026) {
  tourTierBySlug.set(t.slug, t.tier);
  if (t.tier != null && t.tier <= MAX_TIER) tierBPlusTourSlugs.add(t.slug);
}
for (const t of toursDiscovered) {
  if (!tourTierBySlug.has(t.slug)) tourTierBySlug.set(t.slug, t.tier ?? 3);
}

function isTierBPlusMatch(m) {
  if (BSC_RE.test(m.tournamentSlug)) return true;
  const tier = tourTierBySlug.get(m.tournamentSlug);
  return tier != null && tier <= MAX_TIER;
}

const teamsInMatches = new Set();
const teamsInTierBPlusMatches = new Set();
const matchIssues = [];
const teamMatchCount = new Map();

for (const m of matches) {
  const id = m.id;
  const issues = [];
  if (!m.teamASlug?.trim()) issues.push("sin teamA");
  if (!m.teamBSlug?.trim()) issues.push("sin teamB");
  if (!m.tournamentSlug?.trim()) issues.push("sin torneo");
  if (!m.date?.trim()) issues.push("sin fecha");
  if (!["live", "upcoming", "finished", "cancelled"].includes(m.status)) issues.push(`status raro: ${m.status}`);
  if (m.status === "finished" && m.scoreA === m.scoreB && m.scoreA === 0) issues.push("0-0 finished");
  if (!isTierBPlusMatch(m)) issues.push(`torneo fuera tier B+: ${m.tournamentSlug}`);

  if (issues.length) matchIssues.push({ id, issues, tournament: m.tournamentSlug });

  for (const slug of [m.teamASlug, m.teamBSlug]) {
    if (!slug?.trim()) continue;
    teamsInMatches.add(slug);
    teamMatchCount.set(slug, (teamMatchCount.get(slug) ?? 0) + 1);
    if (isTierBPlusMatch(m)) teamsInTierBPlusMatches.add(slug);
  }
}

const discoveredSlugs = new Set(teamsDiscovered.map((t) => t.slug));
const inMatchesNotDiscovered = [...teamsInTierBPlusMatches].filter((s) => !discoveredSlugs.has(s) && !bscSlugs.has(s));
const discoveredNotInMatches = [...discoveredSlugs].filter((s) => !teamsInTierBPlusMatches.has(s));

console.log("=== LOCAL (matches-2026.json) ===");
console.log(`Partidos totales: ${matches.length}`);
console.log(`Partidos tier B+ (BSC + S/A/B): ${matches.filter(isTierBPlusMatch).length}`);
console.log(`Equipos únicos en partidos tier B+: ${teamsInTierBPlusMatches.size}`);
console.log(`teams-discovered.json: ${teamsDiscovered.length}`);
console.log(`BSC núcleo curado: ${bscSlugs.size}`);
console.log(`Suma esperada mínima en DB: ${teamsDiscovered.length + bscSlugs.size} (con solapamiento)`);

console.log("\n=== COHERENCIA LOCAL ===");
console.log(`Equipos en partidos B+ pero NO en discovered ni BSC: ${inMatchesNotDiscovered.length}`);
if (inMatchesNotDiscovered.length) console.log("  ej:", inMatchesNotDiscovered.slice(0, 15).join(", "));
console.log(`Equipos en discovered sin partido B+: ${discoveredNotInMatches.length}`);
if (discoveredNotInMatches.length) console.log("  ej:", discoveredNotInMatches.slice(0, 15).join(", "));
console.log(`Partidos con problemas de datos: ${matchIssues.length}`);
if (matchIssues.length) console.log("  ej:", JSON.stringify(matchIssues.slice(0, 5), null, 2));

const dbTeams = await fetchAll("teams_catalog", "slug,name,circuit_status,bsc_qualified_2026,meta");
const dbMatches = await fetchAll(
  "matches_catalog",
  "id,tournament_slug,team_a_slug,team_b_slug,scheduled_at,status,score_a,score_b,published",
);
const dbTours = await fetchAll("tournaments_catalog", "slug,tier,status");

const dbTeamSlugs = new Set(dbTeams.map((t) => t.slug));
const dbMatchTeams = new Set();
for (const m of dbMatches) {
  if (m.team_a_slug) dbMatchTeams.add(m.team_a_slug);
  if (m.team_b_slug) dbMatchTeams.add(m.team_b_slug);
}

const dbDiscovered = dbTeams.filter((t) => t.circuit_status === "discovered" || t.meta?.tier_pool === "bplus");
const dbBscCore = dbTeams.filter((t) => t.bsc_qualified_2026 === true || t.circuit_status !== "discovered");

const inDbNotInLocalMatches = [...dbTeamSlugs].filter((s) => !teamsInTierBPlusMatches.has(s) && !bscSlugs.has(s));
const inLocalMatchesNotInDb = [...teamsInTierBPlusMatches].filter((s) => !dbTeamSlugs.has(s));

const dbMatchIssues = [];
for (const m of dbMatches) {
  const issues = [];
  if (!m.published) issues.push("no publicado");
  if (!m.team_a_slug || !m.team_b_slug) issues.push("equipo faltante");
  if (!m.tournament_slug) issues.push("sin torneo");
  if (!m.scheduled_at) issues.push("sin fecha");
  if (issues.length) dbMatchIssues.push({ id: m.id, issues });
}

const dbTourTierBPlus = dbTours.filter((t) => t.tier != null && t.tier <= MAX_TIER);

console.log("\n=== SUPABASE ===");
console.log(`teams_catalog: ${dbTeams.length}`);
console.log(`  discovered/bplus: ${dbDiscovered.length}`);
console.log(`  BSC/core u otros: ${dbTeams.length - dbDiscovered.length}`);
console.log(`matches_catalog: ${dbMatches.length} (publicados: ${dbMatches.filter((m) => m.published).length})`);
console.log(`tournaments_catalog tier B+: ${dbTourTierBPlus.length} / ${dbTours.length}`);
console.log(`Equipos únicos en partidos DB: ${dbMatchTeams.size}`);

console.log("\n=== CRUCE DB ↔ LOCAL ===");
console.log(`Equipos en DB sin partido tier B+ local: ${inDbNotInLocalMatches.length}`);
if (inDbNotInLocalMatches.length) console.log("  ej:", inDbNotInLocalMatches.slice(0, 15).join(", "));
console.log(`Equipos en partidos local sin fila DB: ${inLocalMatchesNotInDb.length}`);
if (inLocalMatchesNotInDb.length) console.log("  ej:", inLocalMatchesNotInDb.slice(0, 15).join(", "));
console.log(`Partidos DB con problemas: ${dbMatchIssues.length}`);

const overlapBscDiscovered = [...bscSlugs].filter((s) => discoveredSlugs.has(s));
console.log("\n=== SOLAPAMIENTO BSC ∩ discovered ===");
console.log(`${overlapBscDiscovered.length} equipos en ambos pools`);

const singleMatchTeams = [...teamMatchCount.entries()].filter(([, n]) => n === 1).length;
const topTeams = [...teamMatchCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log("\n=== DISTRIBUCIÓN PARTIDOS POR EQUIPO (local) ===");
console.log(`Con solo 1 partido: ${singleMatchTeams}`);
console.log("Top por volumen:", topTeams.map(([s, n]) => `${s}(${n})`).join(", "));

const verdict = {
  localTeamsInTierBPlusMatches: teamsInTierBPlusMatches.size,
  localDiscovered: teamsDiscovered.length,
  dbTeams: dbTeams.length,
  dbMatches: dbMatches.length,
  dbTournamentsTierBPlus: dbTourTierBPlus.length,
  allDiscoveredHaveMatch: discoveredNotInMatches.length === 0,
  allDbTeamsInMatches: inDbNotInLocalMatches.length <= overlapBscDiscovered.length + 10,
  matchDataClean: matchIssues.length === 0 && dbMatchIssues.length === 0,
  tierRule: `tier <= ${MAX_TIER} (S/A/B) o torneo BSC 2026`,
};

console.log("\n=== VEREDICTO ===");
console.log(JSON.stringify(verdict, null, 2));
