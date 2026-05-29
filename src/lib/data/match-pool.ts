import type { EsportsMatch } from "./matches";
import { matches as legacyMatches } from "./matches";

let runtimePool: EsportsMatch[] | null = null;

/** Hidrata desde servidor (CmsRuntime) — null = usar legacy import. */
export function setRuntimeMatchPool(pool: EsportsMatch[] | null): void {
  runtimePool = pool;
}

export function getMatchPool(): EsportsMatch[] {
  return runtimePool ?? legacyMatches;
}
