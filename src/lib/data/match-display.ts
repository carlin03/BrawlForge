import { parseMatchMeta } from "./match-meta";
import type { EsportsMatch } from "./esports-match-types";

/** Marcador estilo Liquipedia: `3 : 0` */
export function formatLiquipediaScore(scoreA: number, scoreB: number): string {
  return `${scoreA} : ${scoreB}`;
}

export function getLiquipediaMatchUrl(match: EsportsMatch): string | null {
  const meta = parseMatchMeta(match.meta);
  if (meta.liquipedia_url) return meta.liquipedia_url;
  if (meta.liquipedia_page) {
    const page = meta.liquipedia_page.replace(/^\/+/, "");
    return `https://liquipedia.net/${page.startsWith("brawlstars/") ? page : `brawlstars/${page}`}`;
  }
  return null;
}
