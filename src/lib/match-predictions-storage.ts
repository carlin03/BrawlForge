const KEY = "bf_match_predictions";

export type MatchExtendedPrediction = {
  exactScore?: string;
  mvpPlayerSlug?: string;
  firstMapWinner?: "A" | "B";
  decisiveMapWinner?: "A" | "B";
  brawlerMostUsed?: string;
  brawlerMvp?: string;
  brawlerPick?: string;
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
