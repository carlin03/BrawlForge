/**
 * Reglas de publicación: próximos BSC + Liquipedia con fecha real; resultados LP históricos.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Fechas placeholder masivas del parser Liquipedia (no son calendario real). */
export const LP_PLACEHOLDER_DAYS = new Set(["2026-06-06", "2026-06-07"]);
export const LP_PLACEHOLDER_DAY = "2026-06-06";

const INVALID_TEAM = new Set(["", "tbd", "team", "por-definir", ".", "punto"]);

let _bscCircuitSlugs = null;

export function loadBscCircuitSlugs() {
  if (_bscCircuitSlugs) return _bscCircuitSlugs;
  const set = new Set();
  const ts = readFileSync(resolve(root, "src/lib/data/bsc-tournaments.ts"), "utf8");
  for (const m of ts.matchAll(/slug:\s*"(bsc-2026-[^"]+|world-finals-2026[^"]*)"/g)) {
    set.add(m[1]);
  }
  for (const m of ts.matchAll(/`(bsc-2026-[^`]+)`/g)) {
    set.add(m[1]);
  }
  // Monthly Finals: mf("june", "EMEA", …) → bsc-2026-june-emea-mf
  for (const m of ts.matchAll(/mf\s*\(\s*"([^"]+)"\s*,\s*"([A-Z]+)"/g)) {
    set.add(`bsc-2026-${m[1]}-${m[2].toLowerCase()}-mf`);
  }
  const aliasBlock = ts.match(/BSC_TOURNAMENT_ALIASES[^=]*=\s*\{([\s\S]*?)\};/)?.[1] ?? "";
  for (const m of aliasBlock.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    set.add(m[1]);
    set.add(m[2]);
  }
  _bscCircuitSlugs = set;
  return set;
}

export function isBscCircuitSlug(slug) {
  return loadBscCircuitSlugs().has((slug || "").trim());
}

export function isPlaceholderLiquipediaDate(date) {
  return LP_PLACEHOLDER_DAYS.has((date || "").slice(0, 10));
}

const LP_UPCOMING_MAX_FUTURE_MS = 240 * 24 * 60 * 60 * 1000;
const LP_UPCOMING_PAST_GRACE_MS = 12 * 60 * 60 * 1000;

/** Próximo Liquipedia con fecha creíble (excluye placeholder 2026-06-06 y fechas pasadas). */
export function isValidLiquipediaUpcoming(m) {
  const status = m.status || "upcoming";
  if (status !== "upcoming") return false;
  if (!m.date?.trim()) return false;
  if (isPlaceholderLiquipediaDate(m.date)) return false;
  if (m.teamASlug === m.teamBSlug) return false;
  if (!okTeamSlug(m.teamASlug) || !okTeamSlug(m.teamBSlug)) return false;

  const ts = Date.parse(m.date);
  if (Number.isNaN(ts)) return false;
  const now = Date.now();
  if (ts < now - LP_UPCOMING_PAST_GRACE_MS) return false;
  if (ts > now + LP_UPCOMING_MAX_FUTURE_MS) return false;

  const year = Number(m.date.slice(0, 4));
  if (!Number.isFinite(year) || year < 2025) return false;

  const slug = (m.tournamentSlug || "").trim().toLowerCase();
  if (/^brawl-stars-championship-/.test(slug)) return false;

  if (m.scoreA > 0 || m.scoreB > 0) {
    if (m.scoreA !== m.scoreB) return false;
  }

  const td = m.meta?.team_display;
  const hasLpNames = !!(td?.a?.trim() && td?.b?.trim());
  const isLpId = String(m.id || "").startsWith("lp-");
  return hasLpNames || isLpId;
}

export function hasPublishableDate(date) {
  if (!date?.trim()) return false;
  return !Number.isNaN(Date.parse(date));
}

export function okTeamSlug(slug) {
  const k = (slug || "").trim().toLowerCase();
  if (!k || INVALID_TEAM.has(k) || k.startsWith("winner-")) return false;
  return true;
}

/** ¿Publicar este partido en Supabase / calendario? */
function isBracketSlotSlug(slug) {
  const k = (slug || "").trim().toLowerCase();
  return k === "tbd" || k.startsWith("winner-");
}

export function shouldPublishMatch(m) {
  if (!hasPublishableDate(m.date)) return false;
  if (m.teamASlug === m.teamBSlug) return false;

  const isBsc = isBscCircuitSlug(m.tournamentSlug);
  const status = m.status || "upcoming";

  if (isBsc) {
    if (status === "upcoming" && isPlaceholderLiquipediaDate(m.date)) return false;
    const aOk = isBracketSlotSlug(m.teamASlug) || okTeamSlug(m.teamASlug);
    const bOk = isBracketSlotSlug(m.teamBSlug) || okTeamSlug(m.teamBSlug);
    if (!aOk || !bOk) return false;
    return true;
  }

  if (!okTeamSlug(m.teamASlug) || !okTeamSlug(m.teamBSlug)) return false;

  if (status === "upcoming") return isValidLiquipediaUpcoming(m);

  // Liquipedia regional / ligas: historial con resultado
  if (status !== "finished") return false;
  if (isPlaceholderLiquipediaDate(m.date)) return false;
  if (m.scoreA === m.scoreB && m.scoreA === 0) return false;
  const year = Number(m.date.slice(0, 4));
  if (year < 2025) return false;
  return true;
}

export function matchScheduleTrust(m) {
  if (isBscCircuitSlug(m.tournamentSlug)) return "confirmed";
  if (m.status === "finished") return "confirmed";
  if (isValidLiquipediaUpcoming(m)) return "confirmed";
  return "template";
}
