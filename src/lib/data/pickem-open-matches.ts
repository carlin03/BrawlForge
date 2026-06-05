import { getOfficialUpcomingCalendarMatches } from "./bsc-calendar-upcoming";
import { shouldHideIncompletePlayoffRound } from "./bracket-playoff-sanitize";
import { isPickemMatchOpen } from "./match-effective-status";
import { getPublicUpcomingMatches } from "./public-calendar-matches";
import {
  getActivePickemTemplates,
  isPickemTemplateMatch,
  isPublicUpcomingCalendarMatch,
  isStaleTournamentUpcoming,
} from "./match-schedule-trust";
import type { EsportsMatch } from "./esports-match-types";
import { isPickemMatchEligible } from "./pickem-eligibility";
import { getPickemBracketPool } from "./match-pool";
import { matchDedupeKey, pickBetterMatch } from "./playoff-pool-normalize";

function pickemVisible(m: EsportsMatch, pool: EsportsMatch[]): boolean {
  if (!isPickemMatchEligible(m) || !isPickemMatchOpen(m)) return false;
  if (isStaleTournamentUpcoming(m)) return false;
  if (shouldHideIncompletePlayoffRound(pool, m)) return false;
  return true;
}

function upsertPickem(
  byId: Map<string, EsportsMatch>,
  m: EsportsMatch,
  pool: EsportsMatch[],
): void {
  if (!pickemVisible(m, pool)) return;
  const key = matchDedupeKey(m);
  for (const [id, existing] of byId) {
    if (matchDedupeKey(existing) !== key) continue;
    if (!isPickemTemplateMatch(existing) && isPickemTemplateMatch(m)) return;
    const better = pickBetterMatch(existing, m);
    byId.delete(id);
    byId.set(better.id, better);
    return;
  }
  byId.set(m.id, m);
}

function ingestPickemMatch(
  byId: Map<string, EsportsMatch>,
  m: EsportsMatch,
  pool: EsportsMatch[],
  allowTemplate = false,
): void {
  if (!allowTemplate && isPickemTemplateMatch(m)) return;
  if (!isPublicUpcomingCalendarMatch(m)) return;
  if (!pickemVisible(m, pool)) return;
  upsertPickem(byId, m, pool);
}

/** Partidos abiertos para Pick'em — alineado con próximos públicos de /matches. */
export function getPickemOpenMatches(extra: EsportsMatch[] = []): EsportsMatch[] {
  const pool = getPickemBracketPool();
  const byId = new Map<string, EsportsMatch>();

  for (const m of getPublicUpcomingMatches()) {
    ingestPickemMatch(byId, m, pool);
  }

  for (const m of getOfficialUpcomingCalendarMatches(pool)) {
    ingestPickemMatch(byId, m, pool);
  }

  for (const m of getActivePickemTemplates(pool)) {
    ingestPickemMatch(byId, m, pool, true);
  }

  for (const m of extra) {
    upsertPickem(byId, m, pool);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
