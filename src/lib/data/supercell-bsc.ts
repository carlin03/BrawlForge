/**
 * Official Supercell BSC Event Platform — public API + asset URLs
 * Source: https://event.supercell.com/brawlstars/en
 *
 * Public (no login):
 *   GET /brawlstars/v1/event          — eventos activos, streams, reglas
 *   GET /brawlstars/v1/bracket        — cuadro con contestant IDs
 *
 * Requiere sesión Supercell SSO (SPA client-side):
 *   /brawlstars/v1/contestants, /predictions/teams, logos por contestant ID
 */

export const SUPERCELL_BSC_BASE = "https://event.supercell.com";
export const SUPERCELL_BSC_API = `${SUPERCELL_BSC_BASE}/brawlstars/v1`;

/** Assets UI oficiales (PNG/JPG públicos) */
export const SUPERCELL_BSC_ASSETS = {
  shareImage: `${SUPERCELL_BSC_BASE}/brawlstars/share-image.jpg`,
  pageIcon: `${SUPERCELL_BSC_BASE}/brawlstars/page-icon.ico`,
  trophyGold: `${SUPERCELL_BSC_BASE}/brawlstars/images/leaderboard/trophies/trophy-icon-gold.png`,
  trophySilver: `${SUPERCELL_BSC_BASE}/brawlstars/images/leaderboard/trophies/trophy-icon-silver.png`,
  trophyBronze: `${SUPERCELL_BSC_BASE}/brawlstars/images/leaderboard/trophies/trophy-icon-bronze.png`,
} as const;

export interface SupercellStream {
  title: string;
  language: string;
  locale: string;
  platform: string;
  followLink: string;
  photo: string;
  videoId?: string;
  vodId?: string;
  country?: string;
  range?: number;
}

export interface SupercellEvent {
  eventId: string;
  status: string;
  cup: string;
  region: string;
  type: string;
  bracketType: string;
  numberOfContestants: number;
  totalRanges?: number;
  estimatedUsers?: number;
  streams?: SupercellStream[];
}

export interface SupercellBracketMatch {
  id: number;
  completed: boolean;
  winner?: number;
  isSkipped?: boolean;
  isFantasy?: boolean;
  contestant: { id: number; score: number }[];
}

export interface SupercellBracket {
  eventId: string;
  bracketType: string;
  numberOfContestants: number;
  ranges: { rangeId: number; matches: SupercellBracketMatch[] }[];
}

/** Mapeo contestant ID → slug BrawlForge (cuadros BSC 2026, inferido de brackets oficiales). */
export const SUPERCELL_CONTESTANT_SLUGS: Record<number, string> = {
  2: "team-heretics",
  4: "fut-esports",
  5: "natus-vincere",
  6: "crazy-raccoon",
  8: "rival-esports",
  11: "reject",
  13: "feasible-gaming",
  15: "novo-esports",
  20: "tribe-gaming",
  21: "hmble",
  23: "wwl-esports",
  24: "sk-gaming",
  25: "totem-esports",
  27: "skcalalas-ea",
  33: "fut-esports",
  47: "zeta-division",
  51: "loud",
  52: "totem-esports",
  54: "revenant-xspark",
  55: "frenzy-esports",
  56: "zeta-division",
  57: "big",
};

/** eventId Supercell → slug torneo BrawlForge */
export const SUPERCELL_EVENT_TOURNAMENT: Record<string, string> = {
  /** Brawl Cup 2026 (mayo). */
  w4Lu1Ua9yIKv2ZBABn6oP: "bsc-2026-brawl-cup",
  /** June 2026 Monthly Finals por región. */
  "57UicBDQiZW3rOEycvUM7P": "bsc-2026-june-emea-mf",
  fUOdC0IqHXuBhtoegWFeO: "bsc-2026-june-ea-mf",
  "6iVR4E1YiJiezETVwcqn6f": "bsc-2026-june-na-mf",
  "5HIWv7rJuTye6PouIyTGDw": "bsc-2026-june-sa-mf",
};

export function supercellContestantLogoUrl(contestantId: number): string {
  return `${SUPERCELL_BSC_API}/contestant/${contestantId}/logo`;
}

export function supercellStreamerPhotoUrl(photoPath: string): string {
  if (photoPath.startsWith("http")) return photoPath;
  return `${SUPERCELL_BSC_BASE}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`;
}

export function assetUrl(path: string, publicFolderId = "cache-bust"): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${SUPERCELL_BSC_BASE}${path}${sep}publicFolderId=${publicFolderId}`;
}

async function fetchSupercellJson<T>(path: string, revalidate = 0): Promise<T | null> {
  try {
    const res = await fetch(`${SUPERCELL_BSC_API}${path}`, {
      headers: { Accept: "application/json", "User-Agent": "BrawlForge/1.0" },
      next: revalidate > 0 ? { revalidate } : undefined,
      cache: revalidate > 0 ? undefined : "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchSupercellEvents(fresh = false): Promise<SupercellEvent[]> {
  const data = await fetchSupercellJson<SupercellEvent[]>("/event", fresh ? 0 : 120);
  return data ?? [];
}

export async function fetchSupercellBracket(fresh = false): Promise<SupercellBracket[]> {
  const data = await fetchSupercellJson<SupercellBracket[]>("/bracket", fresh ? 0 : 120);
  return data ?? [];
}

export function getContestantIdsFromBracket(bracket: SupercellBracket[]): number[] {
  const ids = new Set<number>();
  for (const b of bracket) {
    for (const range of b.ranges ?? []) {
      for (const match of range.matches ?? []) {
        for (const c of match.contestant ?? []) ids.add(c.id);
      }
    }
  }
  return [...ids].sort((a, b) => a - b);
}

export function slugFromSupercellContestantId(id: number): string | undefined {
  return SUPERCELL_CONTESTANT_SLUGS[id];
}
