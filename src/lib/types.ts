export type Region = "GLOBAL" | "EMEA" | "NA" | "SA" | "EA" | "SEA";

export interface LiveMatch {
  id: string;
  teamA: { name: string; tag: string; score: number; logo: string };
  teamB: { name: string; tag: string; score: number; logo: string };
  tournament: string;
  stage: string;
  map?: string;
  status: "live" | "upcoming" | "finished";
  viewers?: number;
  startsIn?: string;
  region: Region;
}

export interface FantasyTeam {
  id: string;
  name: string;
  owner: string;
  points: number;
  rank: number;
  change: number;
  league: string;
  captain: string;
  value: number;
}

export interface Prediction {
  id: string;
  matchId: string;
  teamA: string;
  teamB: string;
  tournament: string;
  communityPick: { teamA: number; teamB: number };
  closesIn: string;
  totalPredictions: number;
}

export interface PickemEvent {
  id: string;
  name: string;
  prize: string;
  participants: number;
  deadline: string;
  progress: number;
  stages: number;
}

export interface Player {
  id: string;
  name: string;
  tag: string;
  team: string;
  role: string;
  region: Region;
  rating: number;
  fantasyPoints: number;
  trend: "up" | "down" | "stable";
  change: number;
  avatar: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  region: Region;
  rank: number;
  points: number;
  change: number;
  roster: number;
  logo: string;
  form: ("W" | "L" | "D")[];
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  time: string;
  comments: number;
  hot?: boolean;
}

export interface ActivityItem {
  id: string;
  type: "prediction" | "fantasy" | "transfer" | "result" | "pickem";
  message: string;
  time: string;
  user?: string;
}

export interface Tournament {
  id: string;
  name: string;
  region: Region;
  prize: string;
  teams: number;
  status: "live" | "upcoming" | "finished";
  startDate: string;
  stage: string;
}

export interface PredictorLeader {
  id: string;
  username: string;
  points: number;
  accuracy: number;
  streak: number;
  rank: number;
}

export interface FantasyPick {
  player: string;
  team: string;
  role: string;
  points: number;
  ownership: number;
  form: number[];
}
