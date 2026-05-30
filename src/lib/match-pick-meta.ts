import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

export type MatchPickMeta = {
  mvpPlayerSlug?: string;
  firstMapWinner?: "A" | "B";
  decisiveMapWinner?: "A" | "B";
  brawlerMostUsed?: string;
  brawlerMvp?: string;
};

export function pickMetaToExtended(raw: unknown): MatchExtendedPrediction {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: MatchExtendedPrediction = {};
  if (typeof o.mvpPlayerSlug === "string") out.mvpPlayerSlug = o.mvpPlayerSlug;
  if (o.firstMapWinner === "A" || o.firstMapWinner === "B") out.firstMapWinner = o.firstMapWinner;
  if (o.decisiveMapWinner === "A" || o.decisiveMapWinner === "B") out.decisiveMapWinner = o.decisiveMapWinner;
  if (typeof o.brawlerMostUsed === "string") out.brawlerMostUsed = o.brawlerMostUsed;
  if (typeof o.brawlerMvp === "string") out.brawlerMvp = o.brawlerMvp;
  return out;
}

export function extendedToPickMeta(ext: MatchExtendedPrediction): MatchPickMeta {
  const out: MatchPickMeta = {};
  if (ext.mvpPlayerSlug) out.mvpPlayerSlug = ext.mvpPlayerSlug;
  if (ext.firstMapWinner) out.firstMapWinner = ext.firstMapWinner;
  if (ext.decisiveMapWinner) out.decisiveMapWinner = ext.decisiveMapWinner;
  if (ext.brawlerMostUsed) out.brawlerMostUsed = ext.brawlerMostUsed;
  if (ext.brawlerMvp) out.brawlerMvp = ext.brawlerMvp;
  return out;
}
