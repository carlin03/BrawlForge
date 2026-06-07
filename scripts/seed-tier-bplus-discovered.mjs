/**
 * Guarda en Supabase equipos/torneos Liquipedia tier B+ (descubiertos + catálogo 2026).
 *
 *   node scripts/seed-tier-bplus-discovered.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadPlayedTeamSlugs } from "./lib/played-team-slugs.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");
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

const syncedAt = new Date().toISOString();
const MAX_TIER = 3;

const discoveredTeams = JSON.parse(readFileSync(resolve(gen, "teams-discovered.json"), "utf8"));
const discoveredTours = JSON.parse(readFileSync(resolve(gen, "tournaments-discovered.json"), "utf8"));
const tours2026 = JSON.parse(readFileSync(resolve(gen, "tournaments-2026.json"), "utf8"));
const matches = JSON.parse(readFileSync(resolve(gen, "matches-2026.json"), "utf8"));

const INVALID_TEAM = new Set(["", "tbd", "team", "por-definir", ".", "punto"]);

function slugToName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function tagFromSlug(slug) {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length >= 2) return parts.map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  return slug.slice(0, 3).toUpperCase();
}

function okTeamSlug(slug) {
  const k = (slug || "").trim().toLowerCase();
  if (!k || INVALID_TEAM.has(k) || k.startsWith("winner-")) return false;
  return true;
}

const catalogBySlug = new Map();
for (const file of ["teams.json", "teams-2026.json"]) {
  const p = resolve(gen, file);
  try {
    for (const t of JSON.parse(readFileSync(p, "utf8"))) catalogBySlug.set(t.slug, t);
  } catch {
    /* ignore */
  }
}

const teamBySlug = new Map(discoveredTeams.map((t) => [t.slug, t]));

for (const m of matches) {
  for (const raw of [m.teamASlug, m.teamBSlug]) {
    if (!okTeamSlug(raw)) continue;
    const slug = raw.trim().toLowerCase();
    if (teamBySlug.has(slug)) continue;
    const cat = catalogBySlug.get(slug);
    teamBySlug.set(slug, {
      slug,
      name: cat?.name || slugToName(slug),
      tag: cat?.tag || tagFromSlug(slug),
      region: cat?.region || m.region || "GLOBAL",
      source: "liquipedia-match-sync",
    });
  }
}

const { played } = loadPlayedTeamSlugs();
const allDiscoveredTeams = [...teamBySlug.values()]
  .filter((t) => played.has(t.slug))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const matchTourSlugs = new Set(matches.map((m) => m.tournamentSlug));

const teamRows = allDiscoveredTeams.map((t) => ({
  slug: t.slug,
  name: t.name,
  tag: t.tag || t.slug.slice(0, 3).toUpperCase(),
  region: t.region || "GLOBAL",
  country: "",
  earnings: 0,
  rank: null,
  rank_change: 0,
  form: [],
  roster_slugs: [],
  logo_url: null,
  description: null,
  social: {},
  circuit_status: "discovered",
  bsc_qualified_2026: false,
  meta: { source: "liquipedia-discovered", seed: "tier-bplus", tier_pool: "bplus" },
  synced_at: syncedAt,
}));

const tourBySlug = new Map();

for (const t of tours2026) {
  if (t.tier == null || t.tier > MAX_TIER) continue;
  if (!matchTourSlugs.has(t.slug)) continue;
  tourBySlug.set(t.slug, {
    slug: t.slug,
    name: t.name,
    short_name: t.shortName || t.name,
    region: t.region || "GLOBAL",
    prize_pool: t.prizePool || null,
    teams_count: t.teams || 0,
    status: t.status || "upcoming",
    start_date: t.startDate || null,
    end_date: t.endDate || null,
    location: t.location || "Online",
    stage: t.stage || null,
    tier: t.tier,
    liquipedia_page: t.liquipediaPage || null,
    logo_file: t.logoFile || null,
    participant_slugs: t.participantSlugs || [],
    meta: { source: "liquipedia-catalog", seed: "tier-bplus" },
    synced_at: syncedAt,
  });
}

for (const t of discoveredTours) {
  if (!matchTourSlugs.has(t.slug)) continue;
  const prev = tourBySlug.get(t.slug);
  tourBySlug.set(t.slug, {
    slug: t.slug,
    name: t.name,
    short_name: t.shortName || t.name,
    region: t.region || "GLOBAL",
    prize_pool: t.prizePool || null,
    teams_count: t.teams || prev?.teams_count || 0,
    status: t.status || prev?.status || "upcoming",
    start_date: t.startDate || prev?.start_date || null,
    end_date: t.endDate || prev?.end_date || null,
    location: t.location || "Online",
    stage: t.stage || prev?.stage || null,
    tier: t.tier ?? prev?.tier ?? 3,
    liquipedia_page: null,
    logo_file: t.logoFile || prev?.logo_file || null,
    participant_slugs: prev?.participant_slugs || [],
    meta: { source: "liquipedia-discovered", seed: "tier-bplus" },
    synced_at: syncedAt,
  });
}

const tournamentRows = [...tourBySlug.values()];

console.log("Guardando tier B+ en Supabase…");
console.log(`  Equipos (discovered + partidos): ${teamRows.length} (json ${discoveredTeams.length})`);
console.log(`  Torneos tier B+ (con partidos): ${tournamentRows.length}`);

const teamsN = await upsert("teams_catalog", teamRows);
const toursN = await upsert("tournaments_catalog", tournamentRows);

console.log(`Subidos: ${teamsN} equipos, ${toursN} torneos.`);
console.log("Guardado completo en Supabase.");
