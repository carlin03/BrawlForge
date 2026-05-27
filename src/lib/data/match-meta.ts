import type { EsportsMatch } from "./matches";
import { getPlayer, teamName } from "./index";

export interface MatchEnrichment {
  map: string;
  bans: string[];
  mvpSlug: string | null;
  communityPickA: number;
  quickStat: string;
}

const MAPS = ["Hot Zone", "Bounty", "Knockout", "Gem Grab", "Heist", "Basket Brawl"];
const BRAWLERS = ["Kit", "Cordelius", "Mico", "Surge", "Charlie", "Gray", "Buster", "Melodie"];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function getMatchEnrichment(match: EsportsMatch): MatchEnrichment {
  const h = hashId(match.id);
  const map = MAPS[h % MAPS.length];
  const bans = [
    BRAWLERS[h % BRAWLERS.length],
    BRAWLERS[(h + 3) % BRAWLERS.length],
    BRAWLERS[(h + 5) % BRAWLERS.length],
  ];
  const communityPickA = 38 + (h % 25);
  const mvpCandidates = ["moya", "yoshi", "lukii", "boss", "levi"];
  const mvpSlug = match.status !== "upcoming" ? mvpCandidates[h % mvpCandidates.length] : null;

  let quickStat = `${communityPickA}% vota ${teamName(match.teamASlug)}`;
  if (match.status === "finished" && mvpSlug) {
    const mvp = getPlayer(mvpSlug);
    quickStat = `MVP · ${mvp?.ign ?? mvpSlug}`;
  } else if (match.status === "live") {
    quickStat = `Set ${1 + (h % 3)} · ${map}`;
  }

  return { map, bans, mvpSlug, communityPickA, quickStat };
}
