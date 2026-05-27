/** Pick'em bracket data — World Finals 2025 (Stockholm) */

export interface PickemMatch {
  id: string;
  teamASlug: string;
  teamBSlug: string;
  scoreA: number;
  scoreB: number;
  stage: string;
}

export interface PickemEvent {
  slug: string;
  tournamentSlug: string;
  name: string;
  status: "open" | "closed" | "upcoming";
  entries: number;
  completionPct: number;
  rewardPool: string;
  userPoints?: number;
  userRank?: number;
  userMaxPoints: number;
  stages: { id: string; label: string; matches: PickemMatch[] }[];
}

export const pickemEvents: PickemEvent[] = [
  {
    slug: "wf-2025",
    tournamentSlug: "world-finals-2025",
    name: "World Finals 2025 — Stockholm",
    status: "closed",
    entries: 89420,
    completionPct: 100,
    rewardPool: "In-game pins & sprays",
    userPoints: 72,
    userRank: 3841,
    userMaxPoints: 80,
    stages: [
      {
        id: "quarters",
        label: "Quarterfinals",
        matches: [
          { id: "qf1", teamASlug: "crazy-raccoon", teamBSlug: "sk-gaming", scoreA: 3, scoreB: 1, stage: "QF" },
          { id: "qf2", teamASlug: "hmble", teamBSlug: "tribe-gaming", scoreA: 3, scoreB: 2, stage: "QF" },
          { id: "qf3", teamASlug: "fut-esports", teamBSlug: "revenant-xspark", scoreA: 2, scoreB: 3, stage: "QF" },
          { id: "qf4", teamASlug: "totem-esports", teamBSlug: "loud", scoreA: 3, scoreB: 0, stage: "QF" },
        ],
      },
      {
        id: "semis",
        label: "Semifinals",
        matches: [
          { id: "sf1", teamASlug: "crazy-raccoon", teamBSlug: "hmble", scoreA: 3, scoreB: 2, stage: "SF" },
          { id: "sf2", teamASlug: "revenant-xspark", teamBSlug: "totem-esports", scoreA: 1, scoreB: 3, stage: "SF" },
        ],
      },
      {
        id: "final",
        label: "Grand Final",
        matches: [
          { id: "gf", teamASlug: "crazy-raccoon", teamBSlug: "totem-esports", scoreA: 3, scoreB: 1, stage: "GF" },
        ],
      },
    ],
  },
  {
    slug: "wf-2026",
    tournamentSlug: "world-finals-2026",
    name: "World Finals 2026 — Tokyo",
    status: "upcoming",
    entries: 0,
    completionPct: 34,
    rewardPool: "TBD",
    userMaxPoints: 80,
    stages: [],
  },
];

export function getPickem(slug: string): PickemEvent | undefined {
  return pickemEvents.find((p) => p.slug === slug);
}
