import { DEFAULT_BRAWLER_POOL, DEFAULT_MAP_POOL } from "./match-meta";
import type {
  MatchAdvancedPredictionsMeta,
  MatchMapResultMeta,
  MatchMeta,
} from "./match-meta";
import { resolveMatchMapOrder } from "./series-map-utils";
import { isValidSeriesScore } from "./match-format-rules";
import type { EsportsMatch } from "./esports-match-types";

function hashId(id: string, salt = 0): number {
  let h = salt >>> 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function pickN<T>(pool: readonly T[], id: string, salt: number, count: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  let h = hashId(id, salt);
  while (out.length < count && used.size < pool.length) {
    const idx = h % pool.length;
    h = (h * 17 + 13) >>> 0;
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(pool[idx]!);
  }
  return out;
}

/** Reparte victorias por mapa respetando el marcador de la serie. */
export function deriveMapWinnersFromScore(scoreA: number, scoreB: number): ("A" | "B")[] {
  const total = scoreA + scoreB;
  const out: ("A" | "B")[] = [];
  let a = 0;
  let b = 0;
  for (let i = 0; i < total; i++) {
    const aNeed = scoreA - a;
    const bNeed = scoreB - b;
    if (aNeed > bNeed || (aNeed === bNeed && i % 2 === 0)) {
      if (a < scoreA) {
        out.push("A");
        a++;
      } else {
        out.push("B");
        b++;
      }
    } else if (b < scoreB) {
      out.push("B");
      b++;
    } else {
      out.push("A");
      a++;
    }
  }
  return out;
}

export function hasFinishedSeriesResults(meta: MatchMeta): boolean {
  const mr = meta.advanced_predictions?.map_results;
  return !!mr && Object.keys(mr).length > 0;
}

/** Rellena map_results, maps.played y brawlers cuando el partido terminó sin meta de Liquipedia/CMS. */
export function enrichFinishedMatchResults(match: EsportsMatch, meta: MatchMeta): MatchMeta {
  if (match.status !== "finished") return meta;
  if (hasFinishedSeriesResults(meta)) {
    return ensureFinishedBrawlerSummary(meta);
  }

  const scoreA = match.scoreA;
  const scoreB = match.scoreB;
  if (!isValidSeriesScore(scoreA, scoreB, match.format)) return meta;

  const order = resolveMatchMapOrder(meta, match.format);
  const mapWinners = deriveMapWinnersFromScore(scoreA, scoreB);
  const mapResults: Record<string, MatchMapResultMeta> = {};
  const played = order.slice(0, mapWinners.length).map((name, index) => ({
    name,
    played: true,
    order: index + 1,
    decisive:
      index === mapWinners.length - 1 &&
      scoreA > 0 &&
      scoreB > 0 &&
      Math.abs(scoreA - scoreB) === 1,
  }));

  mapWinners.forEach((winner, index) => {
    const picksA = pickN(DEFAULT_BRAWLER_POOL, match.id, index * 11 + 1, 3);
    const picksB = pickN(DEFAULT_BRAWLER_POOL, match.id, index * 11 + 7, 3);
    mapResults[String(index)] = {
      winner,
      picks_a: picksA,
      picks_b: picksB,
      central_bans: pickN(DEFAULT_BRAWLER_POOL, match.id, index * 11 + 3, 2),
      team_bans_a: pickN(DEFAULT_BRAWLER_POOL, match.id, index * 11 + 5, 1),
      team_bans_b: pickN(DEFAULT_BRAWLER_POOL, match.id, index * 11 + 9, 1),
    };
  });

  const allPicks = Object.values(mapResults).flatMap((r) => [
    ...(r.picks_a ?? []),
    ...(r.picks_b ?? []),
  ]);
  const freq = new Map<string, number>();
  for (const b of allPicks) freq.set(b, (freq.get(b) ?? 0) + 1);
  const mostUsed = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const adv: MatchAdvancedPredictionsMeta = {
    ...meta.advanced_predictions,
    exact_score: `${scoreA}-${scoreB}`,
    map_results: mapResults,
    most_used_brawler: mostUsed ?? pickN(DEFAULT_BRAWLER_POOL, match.id, 99, 1)[0],
    match_mvp_brawler: pickN(DEFAULT_BRAWLER_POOL, match.id, 101, 1)[0],
    most_banned_brawler: pickN(DEFAULT_BRAWLER_POOL, match.id, 103, 1)[0],
    lowest_wr_brawler: pickN(DEFAULT_BRAWLER_POOL, match.id, 107, 1)[0],
  };

  const mapPool = meta.maps?.possible?.length ? meta.maps.possible : [...DEFAULT_MAP_POOL];
  const bansA = pickN(mapPool, match.id, 201, 2).filter((m) => !order.includes(m));
  const bansB = pickN(mapPool, match.id, 203, 2).filter((m) => !order.includes(m) && !bansA.includes(m));

  return {
    ...meta,
    notes: meta.notes ?? "esport_enriched",
    maps: {
      ...meta.maps,
      order,
      played,
      decisive: played.find((p) => p.decisive)?.name ?? meta.maps?.decisive,
    },
    bans: {
      maps_a: meta.bans?.maps_a?.length ? meta.bans.maps_a : bansA,
      maps_b: meta.bans?.maps_b?.length ? meta.bans.maps_b : bansB,
      brawlers_a: meta.bans?.brawlers_a?.length
        ? meta.bans.brawlers_a
        : pickN(DEFAULT_BRAWLER_POOL, match.id, 205, 2),
      brawlers_b: meta.bans?.brawlers_b?.length
        ? meta.bans.brawlers_b
        : pickN(DEFAULT_BRAWLER_POOL, match.id, 207, 2),
    },
    brawlers: {
      ...meta.brawlers,
      most_used: meta.brawlers?.most_used?.length
        ? meta.brawlers.most_used
        : [adv.most_used_brawler!, ...pickN(DEFAULT_BRAWLER_POOL, match.id, 209, 4)].filter(Boolean),
      featured: meta.brawlers?.featured?.length
        ? meta.brawlers.featured
        : [adv.match_mvp_brawler!].filter(Boolean),
    },
    advanced_predictions: adv,
  };
}

function ensureFinishedBrawlerSummary(meta: MatchMeta): MatchMeta {
  const adv = meta.advanced_predictions ?? {};
  if (adv.most_used_brawler && adv.match_mvp_brawler) return meta;
  const allPicks = Object.values(adv.map_results ?? {}).flatMap((r) => [
    ...(r.picks_a ?? []),
    ...(r.picks_b ?? []),
  ]);
  const mostUsed = allPicks[0];
  return {
    ...meta,
    advanced_predictions: {
      ...adv,
      most_used_brawler: adv.most_used_brawler ?? mostUsed,
      match_mvp_brawler: adv.match_mvp_brawler ?? mostUsed,
    },
  };
}
