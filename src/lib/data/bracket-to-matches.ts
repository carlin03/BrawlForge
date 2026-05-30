import type { PlayoffBracketConfig, PlayoffBracketsStore } from "./bracket-config";
import type { EsportsMatch } from "./matches";
import { getTournament } from "./matches";

function slotId(tournament: string, stage: string, index: number, a: string, b: string): string {
  const base = `${tournament}-${stage}-${index}-${a}-vs-${b}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return base.slice(0, 120);
}

function matchFromSlot(
  config: PlayoffBracketConfig,
  stage: string,
  index: number,
  teamA: string,
  teamB: string,
  hoursOffset: number,
): EsportsMatch | null {
  if (!teamA?.trim() || !teamB?.trim()) return null;
  const tour = getTournament(config.tournament_slug);
  const base = config.updated_at ? new Date(config.updated_at) : new Date();
  base.setHours(base.getHours() + hoursOffset);

  return {
    id: slotId(config.tournament_slug, stage, index, teamA, teamB),
    teamASlug: teamA,
    teamBSlug: teamB,
    scoreA: 0,
    scoreB: 0,
    tournamentSlug: config.tournament_slug,
    stage,
    date: base.toISOString(),
    status: "upcoming",
    region: tour?.region ?? "GLOBAL",
    format: config.format ?? "Bo5",
    meta: {
      importance: "featured",
      predictions: { winner: true, exact_score: true },
    },
  };
}

export function matchesFromBracketConfig(config: PlayoffBracketConfig): EsportsMatch[] {
  const out: EsportsMatch[] = [];
  let h = 0;

  if (config.rounds.quarters) {
    config.slots.quarters.forEach((slot, i) => {
      const m = matchFromSlot(config, "Quarterfinal", i, slot.team_a_slug, slot.team_b_slug, h++);
      if (m) out.push(m);
    });
  }
  if (config.rounds.semis) {
    config.slots.semis.forEach((slot, i) => {
      const m = matchFromSlot(config, "Semifinal", i, slot.team_a_slug, slot.team_b_slug, h++);
      if (m) out.push(m);
    });
  }
  if (config.rounds.final && config.slots.final) {
    const f = config.slots.final;
    const m = matchFromSlot(config, "Grand Final", 0, f.team_a_slug, f.team_b_slug, h++);
    if (m) out.push(m);
  }
  if (config.rounds.third_place && config.slots.third_place) {
    const t = config.slots.third_place;
    const m = matchFromSlot(config, "Third Place Match", 0, t.team_a_slug, t.team_b_slug, h++);
    if (m) out.push(m);
  }

  return out;
}

export function matchesFromBracketStore(store: PlayoffBracketsStore): EsportsMatch[] {
  const all: EsportsMatch[] = [];
  for (const config of Object.values(store)) {
    if (!config?.tournament_slug) continue;
    all.push(...matchesFromBracketConfig(config));
  }
  return all;
}
