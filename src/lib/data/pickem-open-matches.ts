import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import { shouldHideIncompletePlayoffRound } from "./bracket-playoff-sanitize";
import { isPickemMatchOpen } from "./match-effective-status";
import type { EsportsMatch } from "./matches";
import { isPickemMatchEligible } from "./matches";
import { getMatchPool } from "./match-pool";
import { getMatchStageMeta } from "./match-stage-meta";

const CURATED_IDS = new Set(BSC_UPCOMING_PREDICTION_MATCHES.map((m) => m.id));

function pickemVisible(m: EsportsMatch, pool: EsportsMatch[]): boolean {
  if (!isPickemMatchEligible(m) || !isPickemMatchOpen(m)) return false;
  if (shouldHideIncompletePlayoffRound(pool, m)) return false;
  return true;
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
      byId.set(m.id, m);
    }
  }

  for (const m of pool) {
    if (pickemVisible(m, pool) && CURATED_IDS.has(m.id)) {
      byId.set(m.id, m);
    }
  }

  for (const m of extra) {
    if (pickemVisible(m, pool) && !byId.has(m.id)) byId.set(m.id, m);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
