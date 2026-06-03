import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import { withEffectiveMatchStatus } from "./match-effective-status";
import type { EsportsMatch } from "./matches";
import { isPickemMatchEligible, matches as legacyMatches } from "./matches";

let runtimePool: EsportsMatch[] | null = null;

/** Hidrata desde servidor (CmsRuntime) — null = usar legacy import. */
export function setRuntimeMatchPool(pool: EsportsMatch[] | null): void {
  runtimePool = pool;
}

function mergeCuratedPickem(base: EsportsMatch[]): EsportsMatch[] {
  const byId = new Map(base.map((m) => [m.id, m]));
  for (const m of BSC_UPCOMING_PREDICTION_MATCHES) {
    if (!byId.has(m.id) && isPickemMatchEligible(m)) byId.set(m.id, m);
  }
  return [...byId.values()]
    .map(withEffectiveMatchStatus)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getMatchPool(): EsportsMatch[] {
  const base = runtimePool ?? legacyMatches;
  return mergeCuratedPickem(base);
}
