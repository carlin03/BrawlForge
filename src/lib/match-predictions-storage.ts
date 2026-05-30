const KEY = "bf_match_predictions";

export type MapTeamPicks = { a: string[]; b: string[] };

export type MatchExtendedPrediction = {
  exactScore?: string;
  mvpPlayerSlug?: string;
  firstMapWinner?: "A" | "B";
  decisiveMapWinner?: "A" | "B";
  brawlerMostUsed?: string;
  brawlerMvp?: string;
  brawlerPick?: string;
  /** Ganador por mapa (índice 0-based → A | B). */
  mapWinners?: Record<number, "A" | "B">;
  /** Picks por mapa y equipo. */
  mapBrawlerPicks?: Record<number, MapTeamPicks>;
  /** Bans de brawler predichos por equipo (hasta 2 c/u). */
  brawlerBansA?: string[];
  brawlerBansB?: string[];
};

export function readMatchPredictions(): Record<string, MatchExtendedPrediction> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MatchExtendedPrediction>;
  } catch {
    return {};
  }
}

export function getMatchPrediction(matchId: string): MatchExtendedPrediction {
  return readMatchPredictions()[matchId] ?? {};
}

export function patchMatchPrediction(
  matchId: string,
  patch: Partial<MatchExtendedPrediction>,
): MatchExtendedPrediction {
  const all = readMatchPredictions();
  const next = { ...all[matchId], ...patch };
  if (Object.keys(next).length === 0) delete all[matchId];
  else all[matchId] = next;
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}
