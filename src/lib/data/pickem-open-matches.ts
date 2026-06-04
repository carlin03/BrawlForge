import { shouldHideIncompletePlayoffRound } from "./bracket-playoff-sanitize";
import { isPickemMatchOpen } from "./match-effective-status";
import {
  getActivePickemTemplates,
  getPickemTemplateMatches,
  isPickemTemplateMatch,
  isStaleTournamentUpcoming,
} from "./match-schedule-trust";
import type { EsportsMatch } from "./esports-match-types";
import { isPickemMatchEligible } from "./pickem-eligibility";
import { getMatchPool } from "./match-pool";
import { getMatchStageMeta } from "./match-stage-meta";
import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import { matchDedupeKey, pickBetterMatch } from "./playoff-pool-normalize";

const CURATED_IDS = new Set(BSC_UPCOMING_PREDICTION_MATCHES.map((m) => m.id));

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

/** Partidos abiertos para Pick'em: calendario curado + CMS + brackets guardados. */
export function getPickemOpenMatches(extra: EsportsMatch[] = []): EsportsMatch[] {
  const pool = getMatchPool();
  const byId = new Map<string, EsportsMatch>();

  for (const m of pool) {
    if (!pickemVisible(m, pool)) continue;

    const meta = getMatchStageMeta(m.stage || "");
    const fromAdmin = Boolean(m.stage?.trim());
    const isCurated = CURATED_IDS.has(m.id);

    if (isCurated || fromAdmin || meta.isPlayoff || meta.roundKey === "group") {
      upsertPickem(byId, m, pool);
    }
  }

  for (const m of getActivePickemTemplates(pool)) {
    upsertPickem(byId, m, pool);
  }

  for (const m of extra) {
    upsertPickem(byId, m, pool);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
