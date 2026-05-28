/**
 * Sube catálogo completo a Supabase.
 * Requiere migración 20260529200000_catalog.sql + SUPABASE_SERVICE_ROLE_KEY en .env.local
 *
 * Uso: npm run supabase:seed:catalog
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { TAIYORO_LOGOS } from "./team-logo-urls.mjs";

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

function parseParticipants() {
  const raw = readFileSync(resolve(root, "src/lib/data/bsc-fantasy-participants.ts"), "utf8");
  const m = raw.match(/export const BSC_FANTASY_PARTICIPANTS[^=]*=\s*(\{[\s\S]*\});/);
  if (!m) throw new Error("No se pudo leer BSC_FANTASY_PARTICIPANTS");
  return Function(`"use strict"; return (${m[1]})`)();
}

const teams2026 = JSON.parse(
  readFileSync(resolve(root, "src/lib/data/generated/teams-2026.json"), "utf8"),
);
const players2026 = JSON.parse(
  readFileSync(resolve(root, "src/lib/data/generated/players-2026.json"), "utf8"),
);
const participants = parseParticipants();
const syncedAt = new Date().toISOString();

const teamBySlug = new Map(teams2026.map((t) => [t.slug, t]));

const teamRows = teams2026.map((t) => ({
  slug: t.slug,
  name: t.name,
  tag: t.tag ?? "",
  region: t.region,
  country: t.country ?? "",
  earnings: t.earnings ?? 0,
  rank: t.rank ?? null,
  rank_change: t.rankChange ?? 0,
  form: t.form ?? [],
  liquipedia_page: t.liquipediaPage ?? null,
  logo_file: t.logoFile ?? null,
  logo_url: TAIYORO_LOGOS[t.slug] ?? null,
  roster_slugs: t.roster ?? [],
  achievements: t.achievements ?? [],
  description: `${t.name} (${t.tag}) — ${t.region}${t.country ? ` · ${t.country}` : ""}. Rank #${t.rank ?? "—"}.`,
  social: {},
  meta: {
    liquipediaUrl: t.liquipediaPage
      ? `https://liquipedia.net/brawlstars/${encodeURIComponent(t.liquipediaPage)}`
      : null,
    rosterCount: (t.roster ?? []).length,
    achievementsCount: (t.achievements ?? []).length,
  },
  synced_at: syncedAt,
}));

const playerRows = players2026
  .filter((p) => p.slug && p.ign)
  .map((p) => ({
    slug: p.slug,
    ign: String(p.ign).replace(/<!--[\s\S]*?-->/g, "").trim(),
    real_name: p.realName ?? null,
    team_slug: p.teamSlug || null,
    region: p.region,
    role: p.role ?? "Player",
    status: normStatus(p.status),
    liquipedia_page: p.liquipediaPage ?? null,
    fantasy_points: p.fantasyPoints ?? 0,
    fantasy_ownership: p.fantasyOwnership ?? 0,
    rating: p.rating ?? 1,
    country: null,
    bio: null,
    social: {},
    meta: {
      liquipediaUrl: p.liquipediaPage
        ? `https://liquipedia.net/brawlstars/${encodeURIComponent(p.liquipediaPage)}`
        : null,
      teamName: p.teamSlug ? teamBySlug.get(p.teamSlug)?.name : null,
    },
    synced_at: syncedAt,
  }));

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
      ...(team?.roster ?? []),
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

await upsert("tournament_team_rosters", rosterRows);
await upsert("fantasy_market_catalog", marketRows);

console.log(`  Plantillas torneo: ${rosterRows.length}`);
console.log(`  Mercado fantasy: ${marketRows.length}`);
console.log("Catálogo subido correctamente.");
