import type { Region } from "../types";

export interface GeneratedTeam {
  slug: string;
  name: string;
  tag: string;
  region: Region;
  country: string;
  earnings: number;
  rank: number;
  rankChange: number;
  form: ("W" | "L")[];
  liquipediaPage: string;
  logoFile: string | null;
  roster: string[];
  achievements: { place: string; tournament: string; prize: string; date: string }[];
}

export interface GeneratedPlayer {
  slug: string;
  ign: string;
  realName?: string;
  teamSlug: string;
  region: Region;
  role: string;
  liquipediaPage: string;
  status: string;
  fantasyPoints: number;
  fantasyOwnership: number;
  rating: number;
}

export type TournamentPrizeRow = { place: string; prize: string };

export interface GeneratedTournament {
  slug: string;
  name: string;
  shortName: string;
  region: Region;
  prizePool: string;
  teams: number;
  status: "live" | "upcoming" | "finished";
  startDate: string;
  endDate: string;
  location: string;
  stage: string;
  liquipediaPage: string;
  tier?: number;
  logoFile: string | null;
  participantSlugs?: string[];
  organizer?: string;
  venue?: string;
  eventType?: string;
  series?: string;
  website?: string;
  format?: string;
  winnerSlug?: string;
  prizeBreakdown?: TournamentPrizeRow[];
  matchCount?: number;
}
