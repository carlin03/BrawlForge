import { sanitizePlayoffBracketPool } from "./bracket-playoff-sanitize";
import { isPickemMatchOpen, withEffectiveMatchStatus } from "./match-effective-status";
import { matchContentKey, matchDedupeKey, normalizePlayoffPool, pickBetterMatch } from "./playoff-pool-normalize";
import { inferPlayoffStagesInPool } from "./playoff-stage-infer";
import type { EsportsMatch } from "./esports-match-types";
import { matches as legacyMatches } from "./legacy-matches";
import { enrichMatchForPool } from "./match-pool-enrich";

let runtimePool: EsportsMatch[] | null = null;

/** Hidrata desde servidor (CmsRuntime) — null = usar legacy import. */
export function setRuntimeMatchPool(pool: EsportsMatch[] | null): void {
  runtimePool = pool;
}

function mergeByDedupeKey(byId: Map<string, EsportsMatch>, incoming: EsportsMatch): void {
  const effective = enrichMatchForPool(withEffectiveMatchStatus(incoming));
  const contentKey = matchContentKey(effective);

  for (const [id, existing] of byId) {
    if (matchContentKey(existing) === contentKey) {
      const better = pickBetterMatch(existing, effective);
      byId.delete(id);
      byId.set(better.id, better);
      return;
    }
  }

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

/** Calendario completo (Partidos, torneos, home): todos los cruces, sin slots winner-* inventados. */
function buildPublicMatchPool(base: EsportsMatch[]): EsportsMatch[] {
  const inferred = inferPlayoffStagesInPool(base.map(enrichMatchForPool));
  const normalized = normalizePlayoffPool(inferred);
  const byId = new Map<string, EsportsMatch>();
  for (const m of normalized) {
    mergeByDedupeKey(byId, m);
  }
  return [...byId.values()]
    .map((m) => enrichMatchForPool(withEffectiveMatchStatus(m)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getMatchPool(): EsportsMatch[] {
  const base = runtimePool ?? legacyMatches;
  return buildPublicMatchPool(base);
}

/** Pool con slots winner-qf/sf para bracket pick'em (solo predicciones). */
export function getPickemBracketPool(): EsportsMatch[] {
  return sanitizePlayoffBracketPool(getMatchPool());
}
