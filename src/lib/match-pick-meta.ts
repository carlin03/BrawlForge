import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

export type MatchPickMeta = MatchExtendedPrediction;

export function pickMetaToExtended(raw: unknown): MatchExtendedPrediction {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: MatchExtendedPrediction = {};
  if (typeof o.exactScore === "string") out.exactScore = o.exactScore;
  if (typeof o.mvpPlayerSlug === "string") out.mvpPlayerSlug = o.mvpPlayerSlug;
  if (o.firstMapWinner === "A" || o.firstMapWinner === "B") out.firstMapWinner = o.firstMapWinner;
  if (o.decisiveMapWinner === "A" || o.decisiveMapWinner === "B") out.decisiveMapWinner = o.decisiveMapWinner;
  if (typeof o.brawlerMostUsed === "string") out.brawlerMostUsed = o.brawlerMostUsed;
  if (typeof o.brawlerMvp === "string") out.brawlerMvp = o.brawlerMvp;
  if (typeof o.brawlerMostBanned === "string") out.brawlerMostBanned = o.brawlerMostBanned;
  if (typeof o.brawlerPick === "string") out.brawlerPick = o.brawlerPick;
  if (o.mapWinners && typeof o.mapWinners === "object") {
    out.mapWinners = o.mapWinners as MatchExtendedPrediction["mapWinners"];
  }
  if (o.mapBrawlerPicks && typeof o.mapBrawlerPicks === "object") {
    out.mapBrawlerPicks = o.mapBrawlerPicks as MatchExtendedPrediction["mapBrawlerPicks"];
  }
  if (o.mapBrawlerBans && typeof o.mapBrawlerBans === "object") {
    out.mapBrawlerBans = o.mapBrawlerBans as MatchExtendedPrediction["mapBrawlerBans"];
  }
  if (o.mapTeamBans && typeof o.mapTeamBans === "object") {
    out.mapTeamBans = o.mapTeamBans as MatchExtendedPrediction["mapTeamBans"];
  }
  return out;
}

export function extendedToPickMeta(ext: MatchExtendedPrediction): MatchPickMeta {
  const out: MatchPickMeta = {};
  if (ext.exactScore) out.exactScore = ext.exactScore;
  if (ext.mvpPlayerSlug) out.mvpPlayerSlug = ext.mvpPlayerSlug;
  if (ext.firstMapWinner) out.firstMapWinner = ext.firstMapWinner;
  if (ext.decisiveMapWinner) out.decisiveMapWinner = ext.decisiveMapWinner;
  if (ext.brawlerMostUsed) out.brawlerMostUsed = ext.brawlerMostUsed;
  if (ext.brawlerMvp) out.brawlerMvp = ext.brawlerMvp;
  if (ext.brawlerMostBanned) out.brawlerMostBanned = ext.brawlerMostBanned;
  if (ext.brawlerPick) out.brawlerPick = ext.brawlerPick;
  if (ext.mapWinners && Object.keys(ext.mapWinners).length) out.mapWinners = ext.mapWinners;
  if (ext.mapBrawlerPicks && Object.keys(ext.mapBrawlerPicks).length) {
    out.mapBrawlerPicks = ext.mapBrawlerPicks;
  }
  if (ext.mapBrawlerBans && Object.keys(ext.mapBrawlerBans).length) out.mapBrawlerBans = ext.mapBrawlerBans;
  if (ext.mapTeamBans && Object.keys(ext.mapTeamBans).length) out.mapTeamBans = ext.mapTeamBans;
  return out;
}
