import type { EsportsMatch } from "./matches";
import { loadMatchByIdFromDb } from "@/lib/cms/resolve/matches";
import { findMatchInSeedData } from "./find-match-fast";

/** Partido para páginas públicas — DB primero, seed JSON después (sin pool completo). */
export async function resolveMatchById(id: string): Promise<EsportsMatch | undefined> {
  const fromDb = await loadMatchByIdFromDb(id);
  if (fromDb) return fromDb;
  return findMatchInSeedData(id);
}
