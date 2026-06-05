import { getBscEnrichedMatches } from "./bsc-tournaments-enriched";
import { isBscCircuitSlug } from "./bsc-tournaments";
import { bscMatches } from "./bsc-matches";
import type { EsportsMatch } from "./esports-match-types";
import { enrichMatchForPool } from "./match-pool-enrich";
import { matchContentKey, pickBetterMatch } from "./playoff-pool-normalize";
import { inferPlayoffStagesInPool } from "./playoff-stage-infer";
import { isSchedulableMatch } from "./team-display-resolve";

function upsertMatch(map: Map<string, EsportsMatch>, incoming: EsportsMatch): void {
  const key = matchContentKey(incoming);
  for (const [id, existing] of map) {
    if (matchContentKey(existing) === key) {
      const better = pickBetterMatch(existing, incoming);
      map.delete(id);
      map.set(better.id, better);
      return;
    }
  }
  map.set(incoming.id, incoming);
}

function buildMatches(): EsportsMatch[] {
  const wikiMatches = getBscEnrichedMatches().filter(
    (m) => isBscCircuitSlug(m.tournamentSlug) && isSchedulableMatch(m),
  );
  const wikiInferred = inferPlayoffStagesInPool(wikiMatches);
  const byContent = new Map<string, EsportsMatch>();
  for (const m of wikiInferred) upsertMatch(byContent, m);

  for (const m of bscMatches) {
    if (!isBscCircuitSlug(m.tournamentSlug) || !isSchedulableMatch(m)) continue;
    upsertMatch(byContent, m);
  }

  const extra = [...byContent.values()].map(enrichMatchForPool);
  return extra.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const matches: EsportsMatch[] = buildMatches();
