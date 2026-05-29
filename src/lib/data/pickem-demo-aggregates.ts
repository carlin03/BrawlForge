import type { VoteAggregate } from "@/lib/supabase/game-types";

/** Votos de demostración cuando la BD aún no tiene agregados (solo rellena partidos sin votos reales). */
export const PICKEM_DEMO_AGGREGATES: Record<string, VoteAggregate> = {
  "chal-es-gs-2": { match_id: "chal-es-gs-2", votes_a: 847, votes_b: 398, total_votes: 1245 },
  "chal-es-gs-1": { match_id: "chal-es-gs-1", votes_a: 612, votes_b: 588, total_votes: 1200 },
  "chal-es-gs-3": { match_id: "chal-es-gs-3", votes_a: 421, votes_b: 779, total_votes: 1200 },
  "mf26-jun-emea-sf1": { match_id: "mf26-jun-emea-sf1", votes_a: 1102, votes_b: 498, total_votes: 1600 },
  "mf26-jun-emea-sf2": { match_id: "mf26-jun-emea-sf2", votes_a: 640, votes_b: 560, total_votes: 1200 },
  "mf26-jun-emea-gf": { match_id: "mf26-jun-emea-gf", votes_a: 534, votes_b: 666, total_votes: 1200 },
  "mf26-jun-emea-qf2": { match_id: "mf26-jun-emea-qf2", votes_a: 720, votes_b: 480, total_votes: 1200 },
  "mf26-jun-emea-qf3": { match_id: "mf26-jun-emea-qf3", votes_a: 510, votes_b: 690, total_votes: 1200 },
  "mf26-jun-emea-qf4": { match_id: "mf26-jun-emea-qf4", votes_a: 402, votes_b: 798, total_votes: 1200 },
  "mf26-jun-ea-gf": { match_id: "mf26-jun-ea-gf", votes_a: 891, votes_b: 309, total_votes: 1200 },
  "mf26-jun-ea-sf": { match_id: "mf26-jun-ea-sf", votes_a: 552, votes_b: 548, total_votes: 1100 },
  "mf26-jun-na-gf": { match_id: "mf26-jun-na-gf", votes_a: 445, votes_b: 755, total_votes: 1200 },
  "mf26-jun-sa-gf": { match_id: "mf26-jun-sa-gf", votes_a: 923, votes_b: 277, total_votes: 1200 },
  "mf26-jun-sa-sf": { match_id: "mf26-jun-sa-sf", votes_a: 601, votes_b: 399, total_votes: 1000 },
};

export function mergePickemAggregates(
  fromDb: Record<string, VoteAggregate>,
): Record<string, VoteAggregate> {
  const out = { ...PICKEM_DEMO_AGGREGATES };
  for (const [id, agg] of Object.entries(fromDb)) {
    if (agg.total_votes > 0) out[id] = agg;
  }
  return out;
}
