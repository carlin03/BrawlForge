/**
 * Sube catálogo completo a Supabase.
 * Requiere migración 20260529200000_catalog.sql + SUPABASE_SERVICE_ROLE_KEY en .env.local
 *
 * Uso: npm run supabase:seed:catalog
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { buildBscCatalogEnriched } from "./build-bsc-catalog-enriched.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  let raw = readFileSync(envPath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (k && v) process.env[k] = v;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
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
      throw new Error(`${table} batch ${i}: ${res.status} ${text}`);
    }
    n += batch.length;
  }
  return n;
}

function hashNum(s, mod) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % mod;
  return h;
}

function playerPrice(slug, p, tournamentSlug) {
  const fromPts = 5 + ((p.fantasy_points ?? 70) / 100) * 10;
  const fromRating = (p.rating ?? 1) * 8;
  let base = Math.min(16, Math.max(5.5, Math.round((fromPts + fromRating) * 10) / 10));
  if (tournamentSlug) {
    const tweak = (hashNum(`${slug}:${tournamentSlug}`, 21) - 10) / 20;
    base = Math.min(16, Math.max(5.5, Math.round((base + tweak) * 10) / 10));
  }
  return base;
}

function normStatus(s) {
  const x = (s ?? "Active").toLowerCase();
  if (x === "retired") return "retired";
  if (x === "inactive") return "inactive";
  return "active";
}

function parseConstArray(raw, name) {
  const re = new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`);
  const m = raw.match(re);
  if (!m) throw new Error(`No se pudo leer const ${name}`);
  return [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
}

function loadActiveTeamSlugs() {
  const text = readFileSync(resolve(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
  const m = text.match(/BSC_2026_ACTIVE_TEAM_SLUGS[^[]*\[([\s\S]*?)\]\s*as const/);
  if (!m) throw new Error("BSC_2026_ACTIVE_TEAM_SLUGS not found");
  return [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
}

function parseParticipants() {
  const path = resolve(root, "src/lib/data/bsc-tournament-participants.ts");
  const raw = readFileSync(path, "utf8");
  const MF_EMEA_8 = parseConstArray(raw, "MF_EMEA_8");
  const MF_EA_8 = parseConstArray(raw, "MF_EA_8");
  const MF_NA_8 = parseConstArray(raw, "MF_NA_8");
  const MF_SA_8 = parseConstArray(raw, "MF_SA_8");
  const CN_MF_8 = parseConstArray(raw, "CN_MF_8");
  const activeSlugs = loadActiveTeamSlugs();
  const SA_ACTIVE = activeSlugs.filter((s) =>
    [
      "loud",
      "skcalalas",
      "new-heights-gaming",
      "kaioperro",
      "eternal-esports",
      "alguem-segura",
      "olimpo-squad",
      "bounty-hunters-esports",
      "enosis-esports",
      "bc-gaming-sa",
      "level-esports",
      "oddyssey",
      "acre-lovers",
      "f-a-zurita-gaming",
    ].includes(s),
  );
  const NA_ACTIVE = activeSlugs.filter((s) =>
    [
      "tribe-gaming",
      "only-realm",
      "stmn-esports",
      "team-elektros",
      "vatic-esports",
      "elevate",
      "f-a-homeless",
      "vic-day",
      "legacy-esports",
    ].includes(s),
  );

  const marker = "export const BSC_TOURNAMENT_PARTICIPANTS";
  const start = raw.indexOf(marker);
  if (start < 0) throw new Error("No se pudo leer BSC_TOURNAMENT_PARTICIPANTS");
  const eq = raw.indexOf("=", start);
  let i = raw.indexOf("{", eq);
  let depth = 0;
  let end = i;
  for (; end < raw.length; end++) {
    const ch = raw[end];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end++;
        break;
      }
    }
  }
  const objStr = raw.slice(i, end);
  const participants = Function(
    "MF_EMEA_8",
    "MF_EA_8",
    "MF_NA_8",
    "MF_SA_8",
    "CN_MF_8",
    "SA_ACTIVE",
    "NA_ACTIVE",
    `"use strict"; return (${objStr})`,
  )(MF_EMEA_8, MF_EA_8, MF_NA_8, MF_SA_8, CN_MF_8, SA_ACTIVE, NA_ACTIVE);

  const MF_MONTHS = ["february", "march", "april", "may", "june", "july", "august"];
  for (const month of MF_MONTHS) {
    const key = (r) => `bsc-2026-${month}-${r}-mf`;
    if (!participants[key("emea")]) participants[key("emea")] = [...MF_EMEA_8];
    if (!participants[key("ea")]) participants[key("ea")] = [...MF_EA_8];
    if (!participants[key("na")]) participants[key("na")] = [...MF_NA_8];
    if (!participants[key("sa")]) participants[key("sa")] = [...MF_SA_8];
  }

  return participants;
}

const participants = parseParticipants();
const { teamRows, playerRows, syncedAt } = buildBscCatalogEnriched();
const teamBySlug = new Map(teamRows.map((t) => [t.slug, t]));
const playerBySlug = new Map(playerRows.map((p) => [p.slug, p]));

const tournamentRows = Object.entries(participants).map(([slug, teamList]) => {
  const uniqueTeams = [...new Set(teamList)];
  return {
    slug,
    name: slug.replace(/^bsc-2026-/, "BSC 2026 · ").replace(/-/g, " "),
    short_name: slug.split("-").slice(-2).join(" ").toUpperCase(),
    region: slug.includes("ea")
      ? "EA"
      : slug.includes("emea")
        ? "EMEA"
        : slug.includes("na")
          ? "NA"
          : slug.includes("sa")
            ? "SA"
            : "GLOBAL",
    prize_pool: null,
    teams_count: uniqueTeams.length,
    status: "finished",
    start_date: null,
    end_date: null,
    location: "Online",
    stage: "Completed",
    tier: 1,
    liquipedia_page: null,
    logo_file: null,
    participant_slugs: uniqueTeams,
    meta: { source: "bsc-fantasy-participants", teams: uniqueTeams },
    synced_at: syncedAt,
  };
});

console.log("Subiendo catálogo a Supabase…");
console.log(`  Equipos: ${teamRows.length}`);
console.log(`  Jugadores: ${playerRows.length}`);
console.log(`  Torneos fantasy: ${tournamentRows.length}`);

await upsert("teams_catalog", teamRows);
await upsert("players_catalog", playerRows);
await upsert("tournaments_catalog", tournamentRows);

const rosterRows = [];
const marketRows = [];

for (const [tournamentSlug, teamList] of Object.entries(participants)) {
  const seenTeams = new Set();
  for (const teamSlug of teamList) {
    if (seenTeams.has(teamSlug)) continue;
    seenTeams.add(teamSlug);

    const team = teamBySlug.get(teamSlug);
    const slugs = new Set([
      ...(team?.roster_slugs ?? []),
      ...playerRows.filter((p) => p.team_slug === teamSlug).map((p) => p.slug),
    ]);

    rosterRows.push({
      tournament_slug: tournamentSlug,
      team_slug: teamSlug,
      player_slugs: [...slugs],
    });

    for (const playerSlug of slugs) {
      const p = playerBySlug.get(playerSlug);
      if (!p) continue;
      const price = playerPrice(playerSlug, p, tournamentSlug);
      const tweak = (hashNum(`${playerSlug}:${tournamentSlug}`, 21) - 10) / 20;
      marketRows.push({
        tournament_slug: tournamentSlug,
        player_slug: playerSlug,
        team_slug: teamSlug,
        price,
        price_change: Math.round(tweak * 10) / 10,
        pick_rate: p.fantasy_ownership,
        form: ["W", "L", "W"],
        meta: { ign: p.ign, rating: p.rating, fantasy_points: p.fantasy_points },
      });
    }
  }
}

function dedupeRows(rows, keyFn) {
  const map = new Map();
  for (const row of rows) map.set(keyFn(row), row);
  return [...map.values()];
}

const uniqueRosterRows = dedupeRows(rosterRows, (r) => `${r.tournament_slug}:${r.team_slug}`);
const uniqueMarketRows = dedupeRows(marketRows, (r) => `${r.tournament_slug}:${r.player_slug}`);

await upsert("tournament_team_rosters", uniqueRosterRows);
await upsert("fantasy_market_catalog", uniqueMarketRows);

console.log(`  Plantillas torneo: ${uniqueRosterRows.length}`);
console.log(`  Mercado fantasy: ${uniqueMarketRows.length}`);
console.log("Catálogo subido correctamente.");
