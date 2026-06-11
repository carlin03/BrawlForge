/**
 * Torneos con logo subido por el usuario (Supabase tournament_logo_overrides).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { loadEnv } from "./load-env.mjs";
import { getSupabaseRest } from "./supabase-rest.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE = path.join(root, "src/lib/data/generated/tournament-logos-user.json");

const SEASON_TO_MONTH = {
  1: "february",
  2: "march",
  3: "april",
  4: "may",
  5: "june",
  6: "july",
  7: "august",
};

const LP_REGION = {
  emea: "emea",
  "east-asia": "ea",
  "north-america": "na",
  "south-america": "sa",
};

let _logoSlugs = null;

function readCache() {
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE, "utf8"));
    return new Set((raw.slugs ?? []).map((s) => s.trim().toLowerCase()));
  } catch {
    return new Set();
  }
}

export async function fetchUserLogoSlugsFromSupabase() {
  loadEnv();
  const { url, headers } = getSupabaseRest();
  const res = await fetch(`${url}/rest/v1/tournament_logo_overrides?select=slug&order=slug`, {
    headers,
  });
  if (!res.ok) throw new Error(`tournament_logo_overrides: ${res.status}`);
  const rows = await res.json();
  return rows.map((r) => String(r.slug).trim().toLowerCase()).filter(Boolean);
}

export function loadUserLogoTournamentSlugs() {
  if (!_logoSlugs) _logoSlugs = readCache();
  return _logoSlugs;
}

/** Resuelve slug de partido/Liquipedia → slug BSC con logo del usuario. */
export function resolveLogoTournamentSlug(slug) {
  const s = (slug || "").trim().toLowerCase();
  if (!s) return null;
  const logos = loadUserLogoTournamentSlugs();
  if (!logos.size) return null;
  if (logos.has(s)) return s;

  if (s === "brawl-stars-championship-2026-brawl-cup" && logos.has("bsc-2026-brawl-cup")) {
    return "bsc-2026-brawl-cup";
  }

  let m = s.match(
    /^brawl-stars-championship-2026-season-(\d+)-(emea|east-asia|north-america|south-america)-monthly-finals$/,
  );
  if (m) {
    const month = SEASON_TO_MONTH[Number(m[1])];
    const region = LP_REGION[m[2]];
    if (month && region) {
      const bsc = `bsc-2026-${month}-${region}-mf`;
      if (logos.has(bsc)) return bsc;
    }
  }

  if (/^brawl-stars-championship-2026-road-to-brawl-cup-sa-west/.test(s) && logos.has("bsc-2026-rtbc-sa-west")) {
    return "bsc-2026-rtbc-sa-west";
  }
  if (/^brawl-stars-championship-2026-road-to-brawl-cup-sesa/.test(s) && logos.has("bsc-2026-rtbc-sesa")) {
    return "bsc-2026-rtbc-sesa";
  }

  if (s === "brawl-stars-challengers-brasil-finals" && logos.has("bsc-2026-challengers-brasil")) {
    return "bsc-2026-challengers-brasil";
  }
  if (s === "brawl-stars-challengers-north-america-finals" && logos.has("bsc-2026-challengers-na")) {
    return "bsc-2026-challengers-na";
  }

  if (s.startsWith("bsc-2026-") && logos.has(s)) return s;

  return null;
}

/** Torneo visible en web solo si tiene logo manual del usuario. */
export function isCuratedPublicTournamentSlug(slug) {
  return resolveLogoTournamentSlug(slug) != null;
}

export function listCuratedTournamentSlugs() {
  return [...loadUserLogoTournamentSlugs()].sort();
}

export async function syncUserLogoSlugsToCache() {
  const slugs = await fetchUserLogoSlugsFromSupabase();
  fs.writeFileSync(
    CACHE,
    JSON.stringify({ syncedAt: new Date().toISOString(), slugs: slugs.sort() }, null, 2),
  );
  _logoSlugs = new Set(slugs);
  return slugs;
}
