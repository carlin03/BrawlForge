import type { EsportsMatch } from "./esports-match-types";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { getMatchPool } from "./match-pool";
import { isDisplayableMatch } from "./pickem-eligibility";
import { isPublicScheduleMatch } from "./match-schedule-trust";

function homeMatchScore(m: EsportsMatch): number {
  let score = 0;
  if (m.status === "live") score += 100;
  if (m.tournamentSlug.includes("bsc") || m.tournamentSlug.includes("world-finals")) score += 50;
  if (m.format.includes("5")) score += 10;
  return score;
}

/** Partidos con equipos reales — para home y widgets (calendario confirmado). */
export function getCuratedHomeMatches(
  tab: "live" | "upcoming" | "results",
  limit = 8,
): EsportsMatch[] {
  const all = getMatchPool().filter(isPublicScheduleMatch);
  let pool: EsportsMatch[];
  if (tab === "live") {
    pool = all.filter((m) => getEffectiveMatchStatus(m) === "live");
  } else if (tab === "upcoming") {
    pool = all.filter((m) => getEffectiveMatchStatus(m) === "upcoming");
  } else {
    pool = all.filter((m) => {
      const s = getEffectiveMatchStatus(m);
      return s === "finished" || s === "cancelled";
    });
  }

  return pool
    .filter(isDisplayableMatch)
    .sort((a, b) => {
      const pri = homeMatchScore(b) - homeMatchScore(a);
      if (pri !== 0) return pri;
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return tab === "results" ? tb - ta : ta - tb;
    })
    .slice(0, limit);
}
