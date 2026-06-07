import { isBscCircuitSlug } from "./bsc-tournaments";
import { isLiquipediaNonBscTournament } from "./liquipedia-matches";
import type { EsportsMatch } from "./esports-match-types";

export type MatchDataSource = "bsc-official" | "liquipedia-finished" | "other";

/** Origen del dato — próximos solo BSC; Liquipedia solo resultados históricos. */
export function getMatchDataSource(m: EsportsMatch): MatchDataSource {
  if (isBscCircuitSlug(m.tournamentSlug)) return "bsc-official";
  if (
    m.status === "finished" &&
    (m.id.startsWith("lp-") || isLiquipediaNonBscTournament(m.tournamentSlug))
  ) {
    return "liquipedia-finished";
  }
  return "other";
}

export function getMatchDataSourceLabel(m: EsportsMatch): string | null {
  const src = getMatchDataSource(m);
  if (src === "bsc-official") {
    return m.status === "upcoming" || m.status === "live"
      ? "Calendario oficial BSC 2026"
      : "BSC 2026";
  }
  if (src === "liquipedia-finished") return "Resultado histórico · Liquipedia";
  return null;
}

export function isLiquipediaFinishedMatch(m: EsportsMatch): boolean {
  return getMatchDataSource(m) === "liquipedia-finished";
}
