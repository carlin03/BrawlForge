import type { Region } from "../types";
import type { MatchMeta } from "./match-meta";

export interface EsportsMatch {
  id: string;
  teamASlug: string;
  teamBSlug: string;
  scoreA: number;
  scoreB: number;
  tournamentSlug: string;
  stage: string;
  date: string;
  status: "live" | "upcoming" | "finished" | "cancelled";
  region: Region;
  format: string;
  meta?: MatchMeta;
}
