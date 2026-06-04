import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import { sanitizePlayoffBracketPool } from "./bracket-playoff-sanitize";
import { isPickemMatchOpen, withEffectiveMatchStatus } from "./match-effective-status";
import { matchDedupeKey, normalizePlayoffPool, pickBetterMatch } from "./playoff-pool-normalize";
import type { EsportsMatch } from "./matches";
import { isPickemMatchEligible, matches as legacyMatches } from "./matches";

let runtimePool: EsportsMatch[] | null = null;

/** Hidrata desde servidor (CmsRuntime) — null = usar legacy import. */
export function setRuntimeMatchPool(pool: EsportsMatch[] | null): void {
  runtimePool = pool;
}

function mergeByDedupeKey(byId: Map<string, EsportsMatch>, incoming: EsportsMatch): void {
  const effective = withEffectiveMatchStatus(incoming);
  let replaceId: string | null = null;
  for (const [id, existing] of byId) {
    if (matchDedupeKey(existing) === matchDedupeKey(effective)) {
      replaceId = id;
      break;
    }
  }
  if (replaceId) {
    const prev = byId.get(replaceId)!;
    const better = pickBetterMatch(prev, effective);
    byId.delete(replaceId);
    byId.set(better.id, better);
    return;
  }
  byId.set(effective.id, effective);
}

function mergeCuratedPickem(base: EsportsMatch[]): EsportsMatch[] {
  const merged = sanitizePlayoffBracketPool(normalizePlayoffPool(base));
  const byId = new Map<string, EsportsMatch>();
  for (const m of merged) {
    if (isPickemMatchEligible(m)) mergeByDedupeKey(byId, m);
  }
  for (const m of sanitizePlayoffBracketPool(BSC_UPCOMING_PREDICTION_MATCHES)) {
    const effective = withEffectiveMatchStatus(m);
    if (!isPickemMatchEligible(effective) || !isPickemMatchOpen(effective)) continue;
    mergeByDedupeKey(byId, effective);
  }
  return [...byId.values()]
    .map(withEffectiveMatchStatus)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getMatchPool(): EsportsMatch[] {
  const base = runtimePool ?? legacyMatches;
  return mergeCuratedPickem(base);
}
