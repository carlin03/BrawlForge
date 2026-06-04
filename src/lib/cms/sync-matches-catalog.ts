import { getMatchPool } from "@/lib/data/match-pool";
import type { EsportsMatch } from "@/lib/data/matches";
import { applyDefaultPredictionsToMeta, parseMatchMeta } from "@/lib/data/match-meta";
import { isPublicScheduleMatch } from "@/lib/data/match-schedule-trust";

export function matchToCatalogRow(m: EsportsMatch) {
  const meta = applyDefaultPredictionsToMeta(parseMatchMeta(m.meta));
  return {
    id: m.id,
    tournament_slug: m.tournamentSlug,
    team_a_slug: m.teamASlug,
    team_b_slug: m.teamBSlug,
    scheduled_at: m.date,
    status: m.status,
    stage: m.stage || null,
    region: m.region || null,
    format: m.format || "Bo3",
    score_a: m.scoreA ?? 0,
    score_b: m.scoreB ?? 0,
    published: true,
    meta: {
      ...meta,
      display_status: meta.display_status ?? m.status,
    },
    updated_at: new Date().toISOString(),
  };
}

/** Partidos del calendario público confirmado que aún no están en matches_catalog. */
export function getWebMatchesForCatalog(existingIds: Set<string>) {
  const pool = getMatchPool().filter(isPublicScheduleMatch);
  const toImport = pool.filter((m) => !existingIds.has(m.id));
  return { pool, toImport, total: pool.length };
}

export function buildCatalogUpsertBatch(matches: EsportsMatch[], limit?: number) {
  const slice = limit ? matches.slice(0, limit) : matches;
  return slice.map(matchToCatalogRow);
}
