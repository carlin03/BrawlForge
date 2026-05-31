import { mapCountFromExactScore } from "@/lib/data/series-map-utils";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

/** Quita predicciones de mapas que ya no aplican tras cambiar el marcador exacto. */
export function pruneMapPredictionsForExactScore(
  ext: MatchExtendedPrediction,
  exactScore: string | undefined,
  format: string,
): Partial<MatchExtendedPrediction> {
  const count = mapCountFromExactScore(exactScore, format);
  if (count == null) {
    return {
      mapWinners: undefined,
      mapBrawlerPicks: undefined,
      mapBrawlerBans: undefined,
      mapTeamBans: undefined,
    };
  }

  const pruneRecord = <T extends Record<number, unknown>>(rec?: T): T | undefined => {
    if (!rec) return undefined;
    const next = { ...rec };
    for (const key of Object.keys(next)) {
      if (Number(key) >= count) delete next[Number(key) as keyof T];
    }
    return Object.keys(next).length ? next : undefined;
  };

  return {
    mapWinners: pruneRecord(ext.mapWinners),
    mapBrawlerPicks: pruneRecord(ext.mapBrawlerPicks),
    mapBrawlerBans: pruneRecord(ext.mapBrawlerBans),
    mapTeamBans: pruneRecord(ext.mapTeamBans),
  };
}
