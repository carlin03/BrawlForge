import { getBscCircuitTournaments } from "./matches";
import type { EsportsTournament } from "./matches";

/** Todos los eventos BSC 2026 curados para el home (enriquecidos, sin catálogo Liquipedia) */
export function getHomeTournaments(limit?: number): EsportsTournament[] {
  return getBscCircuitTournaments(limit);
}
