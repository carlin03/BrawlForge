import { isBscCircuitSlug } from "./bsc-tournaments";
import { isLiquipediaNonBscTournament } from "./liquipedia-matches";
import { isValidLiquipediaUpcoming } from "./match-publish-rules";
import type { EsportsMatch } from "./esports-match-types";

export type MatchDataSource = "bsc-official" | "liquipedia-finished" | "liquipedia-upcoming" | "other";

export function getMatchDataSource(m: EsportsMatch): MatchDataSource {
  if (isBscCircuitSlug(m.tournamentSlug)) return "bsc-official";
  const isLp =
    m.id.startsWith("lp-") || isLiquipediaNonBscTournament(m.tournamentSlug);
  if (isLp && m.status === "finished") return "liquipedia-finished";
  if (isLp && (m.status === "upcoming" || m.status === "live") && isValidLiquipediaUpcoming(m)) {
    return "liquipedia-upcoming";
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
  if (src === "liquipedia-upcoming") return "Próximo · Liquipedia";
  return null;
}

export function isLiquipediaFinishedMatch(m: EsportsMatch): boolean {
  return getMatchDataSource(m) === "liquipedia-finished";
}
