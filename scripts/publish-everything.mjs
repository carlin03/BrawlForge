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
import { deleteMatchesNotIn, deletePlayersNotIn, deletePlayersWithOrphanTeam, deleteTournamentsNotIn } from "./lib/supabase-delete.mjs";
import { listCuratedTournamentSlugs } from "./lib/curated-tournament-slugs.mjs";
import { syncUserLogoSlugsToCache } from "./lib/tournament-logo-slugs.mjs";
import {
  shouldPublishMatch,
  matchScheduleTrust,
  isBscCircuitSlug,
  isValidLiquipediaUpcoming,
} from "./lib/match-publish-filter.mjs";
import { loadBscUpcomingCalendar } from "./lib/parse-bsc-upcoming-ts.mjs";
import { dedupeMatchPool } from "./lib/match-dedupe-pool.mjs";

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
  const trust = matchScheduleTrust(m);
  const meta = { schedule_trust: trust, pickem_only: trust === "template", ...(m.meta || {}) };
  if (isBscCircuitSlug(m.tournamentSlug)) {
    meta.schedule_trust = "confirmed";
    meta.pickem_only = false;
  } else if (isValidLiquipediaUpcoming(m)) {
    meta.schedule_trust = "confirmed";
    meta.pickem_only = false;
    meta.data_source = meta.data_source || "liquipedia";
  }
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

function buildLpTeamDisplayIndex(matches) {
  const bySlug = new Map();
  for (const m of matches) {
    const td = m.meta?.team_display;
    if (!td) continue;
    if (td.a && m.teamASlug) bySlug.set(m.teamASlug, td.a);
    if (td.b && m.teamBSlug) bySlug.set(m.teamBSlug, td.b);
  }
  return bySlug;
}

function fillTeamDisplay(m, bySlug) {
  const td = m.meta?.team_display ?? {};
  const a = td.a || bySlug.get(m.teamASlug);
  const b = td.b || bySlug.get(m.teamBSlug);
  if (!a && !b) return m;
  return {
    ...m,
    meta: {
      ...(m.meta || {}),
      team_display: { a: a || td.a, b: b || td.b },
    },
  };
}

function attachLiquipediaTournamentMeta(m, tourUrls) {
  const url = tourUrls.get(m.tournamentSlug);
  if (!url || m.meta?.liquipedia_url) return m;
  const page = url.replace("https://liquipedia.net/brawlstars/", "");
  return {
    ...m,
    meta: {
      ...(m.meta || {}),
      liquipedia_url: url,
      liquipedia_page: page,
    },
  };
}

function buildPublishMatchPool() {
  const fromJson = JSON.parse(readFileSync(resolve(gen, "matches-2026.json"), "utf8"));
  const enrichedPath = resolve(gen, "bsc-tournaments-enriched.json");
  const enrichedBundle = JSON.parse(readFileSync(enrichedPath, "utf8"));
  const enriched = enrichedBundle.matches ?? [];
  const supercellPath = resolve(gen, "supercell-bracket-matches.json");
  let supercellMatches = [];
  try {
    const sc = JSON.parse(readFileSync(supercellPath, "utf8"));
    supercellMatches = sc.matches ?? [];
  } catch {
    /* opcional */
  }
  const tourUrls = new Map();
  for (const t of Object.values(enrichedBundle.tournaments ?? {})) {
    if (t?.slug && t?.liquipediaUrl) tourUrls.set(t.slug, t.liquipediaUrl);
  }
  let bscUpcoming = [];
  try {
    bscUpcoming = loadBscUpcomingCalendar().map((m) => ({
      ...m,
      meta: { schedule_trust: "confirmed", pickem_only: false },
    }));
  } catch (e) {
    console.warn("  (calendario BSC upcoming no cargado:", e.message, ")");
  }

  const supercellTourSlugs = new Set(
    supercellMatches
      .filter((m) => shouldPublishMatch(m))
      .map((m) => m.tournamentSlug)
      .filter(Boolean),
  );

  const byId = new Map();
  for (const m of fromJson) {
    if (!shouldPublishMatch(m)) continue;
    byId.set(m.id, m);
  }
  for (const m of bscUpcoming) {
    if (supercellTourSlugs.has(m.tournamentSlug)) continue;
    if (!shouldPublishMatch(m)) continue;
    byId.set(m.id, m);
  }
  // Liquipedia BSC enriquecido (histórico, nombres VS)
  for (const m of enriched) {
    if (supercellTourSlugs.has(m.tournamentSlug)) continue;
    if (!shouldPublishMatch(m)) continue;
    byId.set(m.id, m);
  }
  // Supercell BSC gana sobre seeds/LP en torneos activos
  for (const m of supercellMatches) {
    if (!shouldPublishMatch(m)) continue;
    byId.set(m.id, m);
  }
  const pool = dedupeMatchPool([...byId.values()]);
  const displayIndex = buildLpTeamDisplayIndex([...fromJson, ...enriched]);
  return pool
    .map((m) => fillTeamDisplay(m, displayIndex))
    .map((m) => attachLiquipediaTournamentMeta(m, tourUrls));
}

async function seedMatches() {
  const matches = buildPublishMatchPool();
  const rows = dedupeById(matches.map(matchToRow));
  console.log(`\n▶ Partidos publicables → matches_catalog (${rows.length}, dedupe cruce aplicado)`);
  const n = await upsert("matches_catalog", rows);
  const deleted = await deleteMatchesNotIn(rows.map((r) => r.id));
  console.log(`  Subidos: ${n} partidos · eliminados obsoletos: ${deleted}`);
  return n;
}

async function seedPlayers() {
  const players = JSON.parse(readFileSync(resolve(gen, "players-2026.json"), "utf8"));
  const rows = players.map(playerToRow);
  console.log(`\n▶ Jugadores 2026 → players_catalog (${rows.length})`);
  const n = await upsert("players_catalog", rows);
  const orphanDel = await deletePlayersWithOrphanTeam();
  const staleDel = await deletePlayersNotIn(rows.map((r) => r.slug));
  console.log(`  Subidos: ${n} jugadores · huérfanos: ${orphanDel} · obsoletos: ${staleDel}`);
  return n;
}

console.log("═══════════════════════════════════════════");
console.log(" BrawlForge — publicación 100% a Supabase");
console.log("═══════════════════════════════════════════");

runStep("Sincronizar torneos con logo (usuario)", "node", [
  "scripts/sync-tournament-logo-slugs.mjs",
  "--write",
]);

runStep("Sincronizar cuadros Supercell BSC", "node", ["scripts/sync-supercell-brackets.mjs", "--write"]);
try {
  runStep("Enriquecer torneos BSC (Liquipedia)", "node", [
    "scripts/sync-bsc-tournaments-liquipedia.mjs",
    "--write",
  ]);
} catch (e) {
  console.warn("  (Liquipedia omitido:", e.message, "— usando cache local)");
}

runStep("Purgar torneos sin logo manual", "node", [
  "scripts/purge-non-curated-tournaments.mjs",
  "--write",
]);
runStep("Purgar próximos Liquipedia falsos", "node", ["scripts/purge-lp-upcoming.mjs", "--write"]);
runStep("Purgar equipos sin partidos (JSON + Supabase)", "node", [
  "scripts/purge-teams-without-matches.mjs",
  "--write",
]);
runStep("Catálogo BSC (equipos, jugadores, torneos fantasy)", "npm", ["run", "supabase:seed:catalog"]);
runStep("Tier B+ descubierto (equipos + torneos Liquipedia)", "npm", ["run", "supabase:seed:discovered"]);

const matchesN = await seedMatches();
const playersN = await seedPlayers();

try {
  const tourDeleted = await deleteTournamentsNotIn(listCuratedTournamentSlugs());
  if (tourDeleted) console.log(`\n▶ Torneos obsoletos eliminados: ${tourDeleted}`);
} catch (e) {
  console.warn("  (purge torneos opcional:", e.message, ")");
}

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
