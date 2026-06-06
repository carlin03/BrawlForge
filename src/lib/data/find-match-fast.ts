import type { EsportsMatch } from "./esports-match-types";
import { bscMatches } from "./bsc-matches";
import matches2026 from "./generated/matches-2026.json";
import type { GeneratedMatch } from "./catalog";
import { enrichMatchForPool } from "./match-pool-enrich";

function fromGenerated(m: GeneratedMatch): EsportsMatch {
  return enrichMatchForPool({
    id: m.id,
    teamASlug: m.teamASlug,
    teamBSlug: m.teamBSlug,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    tournamentSlug: m.tournamentSlug,
    stage: m.stage,
    date: m.date,
    status: m.status,
    region: m.region,
    format: m.format,
  });
}

/** Búsqueda O(n) sin construir el pool completo (evita timeout en serverless). */
export function findMatchInSeedData(id: string): EsportsMatch | undefined {
  const key = id.trim();
  const bsc = bscMatches.find((m) => m.id === key);
  if (bsc) return enrichMatchForPool(bsc);
  const gen = (matches2026 as GeneratedMatch[]).find((m) => m.id === key);
  return gen ? fromGenerated(gen) : undefined;
}
