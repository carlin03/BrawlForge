import { getMatchPool } from "@/lib/data/match-pool";
import type { EsportsMatch } from "@/lib/data/matches";
import { parseMatchMeta } from "@/lib/data/match-meta";

const DEFAULT_PREDICTIONS_META = {
  predictions: {
    winner: true,
    exact_score: true,
    mvp: true,
    first_map: false,
    decisive_map: false,
    brawler_most_used: false,
    brawler_mvp: false,
    advanced: false,
  },
};

export function matchToCatalogRow(m: EsportsMatch) {
  const meta = parseMatchMeta(m.meta);
  const predictions = meta.predictions ?? DEFAULT_PREDICTIONS_META.predictions;
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
      predictions,
      display_status: meta.display_status ?? m.status,
    },
    updated_at: new Date().toISOString(),
  };
}

/** Partidos visibles en la web (legacy + pick'em) que aún no están en matches_catalog. */
export function getWebMatchesForCatalog(existingIds: Set<string>) {
  const pool = getMatchPool();
  const toImport = pool.filter((m) => !existingIds.has(m.id));
  return { pool, toImport, total: pool.length };
}

export function buildCatalogUpsertBatch(matches: EsportsMatch[], limit?: number) {
  const slice = limit ? matches.slice(0, limit) : matches;
  return slice.map(matchToCatalogRow);
}
