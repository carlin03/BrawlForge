import type { MapCatalogEntry } from "@/lib/data/game-assets-catalog";
import { resolveMapForMatch } from "@/lib/data/resolve-match-assets";
import type { MatchMeta } from "@/lib/data/match-meta";

function topByWinRate(map: MapCatalogEntry, limit: number): string[] {
  if (!map.win_rates?.length) return (map.best_picks ?? []).slice(0, limit);
  return map.win_rates
    .slice()
    .sort((a, b) => (parseFloat(b.rate) || 0) - (parseFloat(a.rate) || 0))
    .slice(0, limit)
    .map((w) => w.brawler);
}

function bottomByWinRate(map: MapCatalogEntry, limit: number): string[] {
  if (!map.win_rates?.length) return (map.best_picks ?? []).slice(-limit).reverse();
  return map.win_rates
    .slice()
    .sort((a, b) => (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0))
    .slice(0, limit)
    .map((w) => w.brawler);
}

function uniq(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const k = n.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

/** Sugerencias agregadas de la API/catálogo para los mapas de la serie. */
export function aggregateMapBrawlerSuggestions(
  mapNames: string[],
  meta: MatchMeta,
  catalog: MapCatalogEntry[],
): { byWr: string[]; mostUsed: string[]; mostBanned: string[]; lowestWr: string[] } {
  const wr: string[] = [];
  const used: string[] = [];
  const banned: string[] = [];
  const low: string[] = [];

  for (const name of mapNames) {
    const m = resolveMapForMatch(name, meta, catalog);
    wr.push(...topByWinRate(m, 5));
    low.push(...bottomByWinRate(m, 5));
    used.push(...(m.most_used ?? []));
    banned.push(...(m.most_banned ?? []));
  }

  const metaB = meta.brawlers;
  if (metaB?.most_used?.length) used.unshift(...metaB.most_used);
  if (metaB?.recommended?.length) wr.unshift(...metaB.recommended);

  return {
    byWr: uniq(wr).slice(0, 12),
    mostUsed: uniq(used).slice(0, 12),
    mostBanned: uniq(banned).slice(0, 12),
    lowestWr: uniq(low).slice(0, 12),
  };
}
