import type { EsportsMatch } from "./matches";
import { getMatch } from "./matches";
import { resolveMatchList } from "@/lib/cms/resolve/matches";

/** Partido para páginas públicas: CMS (matches_catalog) + legacy fusionados. */
export async function resolveMatchById(id: string): Promise<EsportsMatch | undefined> {
  const { pool } = await resolveMatchList();
  return pool.find((m) => m.id === id) ?? getMatch(id);
}
