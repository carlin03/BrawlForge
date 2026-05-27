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
  estimatedUsers?: number;
  streams?: SupercellStream[];
}

export interface SupercellBracketMatch {
  id: number;
  completed: boolean;
  winner?: number;
  contestant: { id: number; score: number }[];
}

export interface SupercellBracket {
  eventId: string;
  bracketType: string;
  numberOfContestants: number;
  ranges: { rangeId: number; matches: SupercellBracketMatch[] }[];
}

/** Mapeo contestant ID → slug BrawlForge (World Championship / eventos globales) */
export const SUPERCELL_CONTESTANT_SLUGS: Record<number, string> = {
  4: "crazy-raccoon",
  6: "sk-gaming",
  8: "hmble",
  20: "tribe-gaming",
  33: "fut-esports",
  47: "zeta-division",
  51: "loud",
  52: "totem-esports",
  54: "revenant-xspark",
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

async function fetchSupercellJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SUPERCELL_BSC_API}${path}`, {
      headers: { Accept: "application/json", "User-Agent": "BrawlForge/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchSupercellEvents(): Promise<SupercellEvent[]> {
  const data = await fetchSupercellJson<SupercellEvent[]>("/event");
  return data ?? [];
}

export async function fetchSupercellBracket(): Promise<SupercellBracket[]> {
  const data = await fetchSupercellJson<SupercellBracket[]>("/bracket");
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
