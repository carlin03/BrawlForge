import type { EsportsMatch } from "./esports-match-types";
import { normalizePlayoffPool, matchDedupeKey, pickBetterMatch } from "./playoff-pool-normalize";

/** Fusiona DB + legacy: una fila por cruce; gana CMS sobre seed. */
export function mergeMatchPools(db: EsportsMatch[], legacy: EsportsMatch[]): EsportsMatch[] {
  const dbIds = new Set(db.map((m) => m.id));
  const byKey = new Map<string, EsportsMatch>();

  function upsert(incoming: EsportsMatch) {
    const key = matchDedupeKey(incoming);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, incoming);
      return;
    }
    const prevDb = dbIds.has(prev.id);
    const nextDb = dbIds.has(incoming.id);
    if (prevDb && !nextDb) return;
    if (!prevDb && nextDb) {
      byKey.set(key, incoming);
      return;
    }
    byKey.set(key, pickBetterMatch(prev, incoming));
  }

  for (const m of legacy) upsert(m);
  for (const m of db) upsert(m);

  return normalizePlayoffPool([...byKey.values()]).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
