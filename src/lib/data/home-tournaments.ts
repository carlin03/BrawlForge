import { getTierBPlusTournaments } from "./matches";
import type { EsportsTournament } from "./matches";

/** Eventos tier B+ (S/A/B) con partidos en 2026 — BSC + Liquipedia. */
export function getHomeTournaments(limit?: number): EsportsTournament[] {
  return getTierBPlusTournaments(limit);
}
