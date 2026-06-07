/**
 * Reglas de publicación: próximos solo BSC 2026 curado; Liquipedia regional solo resultados.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Fecha placeholder masiva del parser Liquipedia (no es calendario real). */
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
  return (date || "").slice(0, 10) === LP_PLACEHOLDER_DAY;
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
  if (!m.date?.trim()) return false;
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

  // Liquipedia regional / ligas: solo historial con resultado
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
  return "template";
}
