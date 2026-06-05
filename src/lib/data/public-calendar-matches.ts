import { getEffectiveMatchStatus } from "./match-effective-status";
import { parseMatchMeta } from "./match-meta";
import type { EsportsMatch } from "./esports-match-types";
import { getMatchPool } from "./match-pool";
import {
  isPublicScheduleMatch,
  isPublicUpcomingCalendarMatch,
} from "./match-schedule-trust";

/** Partido aún por jugar (o en directo) — excluye fechas pasadas sin resultado. */
export function isScheduledStillOpen(m: EsportsMatch): boolean {
  const status = getEffectiveMatchStatus(m);
  if (status === "live") return true;
  if (status !== "upcoming") return false;
  const scheduled = new Date(m.date).getTime();
  if (Number.isNaN(scheduled)) return true;
  return scheduled > Date.now();
}

/** Próximos/en vivo públicos — misma base para /matches y /predictions. */
export function getPublicUpcomingMatches(): EsportsMatch[] {
  return getMatchPool()
    .filter(
      (m) =>
        isPublicUpcomingCalendarMatch(m) &&
        isScheduledStillOpen(m) &&
        (getEffectiveMatchStatus(m) === "upcoming" || getEffectiveMatchStatus(m) === "live"),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** Resultados terminados con marcador o meta creíble (sin 0-0 fantasma). */
export function isCredibleFinishedResult(m: EsportsMatch): boolean {
  if (getEffectiveMatchStatus(m) !== "finished") return true;

  if (m.scoreA !== m.scoreB && (m.scoreA > 0 || m.scoreB > 0)) return true;

  const meta = parseMatchMeta(m.meta);
  const mapResults = meta.advanced_predictions?.map_results;
  if (mapResults && Object.keys(mapResults).length > 0) return true;

  if (metaSaysFinished(meta)) return true;

  return false;
}

function metaSaysFinished(meta: ReturnType<typeof parseMatchMeta>): boolean {
  const sync = (meta as { sync?: { completed?: boolean } }).sync;
  if (sync?.completed === true) return true;
  return meta.display_status === "finished";
}

export function getPublicFinishedMatches(): EsportsMatch[] {
  return getMatchPool()
    .filter(
      (m) =>
        isPublicScheduleMatch(m) &&
        getEffectiveMatchStatus(m) === "finished" &&
        isCredibleFinishedResult(m),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
