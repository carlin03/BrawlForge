import { parseMatchMeta } from "./match-meta";
import type { EsportsMatch } from "./esports-match-types";

/** World Finals 2026 (Tokyo) — noviembre en adelante. */
export const WORLD_FINALS_EARLIEST_MS = Date.parse("2026-11-01T00:00:00Z");

const BRAWL_CUP_SLUG = "bsc-2026-brawl-cup";

/** Partido de mayo–octubre etiquetado como WF → Brawl Cup (evento Supercell global). */
export function isMislabeledWorldFinalsMatch(m: EsportsMatch): boolean {
  if (m.tournamentSlug !== "world-finals-2026") return false;
  const t = Date.parse(m.date);
  if (!Number.isNaN(t) && t < WORLD_FINALS_EARLIEST_MS) return true;
  const meta = parseMatchMeta(m.meta);
  const sync = (meta as { sync?: { source?: string; eventId?: string } }).sync;
  if (sync?.source === "supercell" || sync?.eventId) return true;
  return false;
}

/**
 * Partidos del evento Supercell / CMS etiquetados mal como World Finals.
 * El bracket global de mayo (Brawl Cup) no es Tokyo.
 */
export function fixMislabeledWorldFinalsSlug(m: EsportsMatch): EsportsMatch {
  if (!isMislabeledWorldFinalsMatch(m)) return m;
  return { ...m, tournamentSlug: BRAWL_CUP_SLUG };
}

export function sanitizeMatchPoolTournamentSlugs(matches: EsportsMatch[]): EsportsMatch[] {
  return matches.map(fixMislabeledWorldFinalsSlug);
}