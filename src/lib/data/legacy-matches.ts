import { getBscEnrichedMatches } from "./bsc-tournaments-enriched";
import { isBscCircuitSlug } from "./bsc-tournaments";
import { bscMatches } from "./bsc-matches";
import type { EsportsMatch } from "./esports-match-types";
import { enrichMatchForPool } from "./match-pool-enrich";
import { matchDedupeKey } from "./playoff-pool-normalize";
import { isSchedulableMatch } from "./pickem-eligibility";

function buildMatches(): EsportsMatch[] {
  const wikiMatches = getBscEnrichedMatches().filter(
    (m) => isBscCircuitSlug(m.tournamentSlug) && isSchedulableMatch(m),
  );
  const keys = new Set(wikiMatches.map(matchDedupeKey));
  const manualFallback = bscMatches.filter(
    (m) => isBscCircuitSlug(m.tournamentSlug) && isSchedulableMatch(m) && !keys.has(matchDedupeKey(m)),
  );
  const extra = [...wikiMatches, ...manualFallback].map(enrichMatchForPool);
  return extra.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const matches: EsportsMatch[] = buildMatches();
