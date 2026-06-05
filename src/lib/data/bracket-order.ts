import { parseMatchMeta } from "./match-meta";
import { getMatchStageMeta } from "./match-stage-meta";
import type { EsportsMatch } from "./esports-match-types";

/** Índice de slot en bracket (qf1→0, sf2→1) para emparejar cuartos → semis. */
export function bracketSlotFromMatch(m: Pick<EsportsMatch, "id" | "meta">): number {
  const meta = parseMatchMeta(m.meta);
  if (typeof meta.bracket_slot === "number" && Number.isFinite(meta.bracket_slot)) {
    return meta.bracket_slot;
  }

  const qf = /-qf(\d+)(?:$|[-_])/i.exec(m.id);
  if (qf) return Number(qf[1]) - 1;

  const sf = /-sf(\d+)(?:$|[-_])/i.exec(m.id);
  if (sf) return Number(sf[1]) - 1;

  const lpQf = /-vs-[^-]+-(\d{4}-\d{2}-\d{2})$/i.exec(m.id);
  if (lpQf) return 999;

  return 999;
}

export function sortBracketRoundMatches<T extends Pick<EsportsMatch, "id" | "meta" | "date">>(
  list: T[],
): T[] {
  return [...list].sort((a, b) => {
    const sa = bracketSlotFromMatch(a);
    const sb = bracketSlotFromMatch(b);
    if (sa !== sb) return sa - sb;
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (!Number.isNaN(da) && !Number.isNaN(db) && da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

export function isPlayoffRoundKey(roundKey: string): boolean {
  return roundKey === "quarter" || roundKey === "semi" || roundKey === "final" || roundKey === "grand_final";
}

export function poolMergeKey(m: EsportsMatch): string {
  const rk = getMatchStageMeta(m.stage).roundKey;
  if (isPlayoffRoundKey(rk)) {
    const slot = bracketSlotFromMatch(m);
    const tour = m.tournamentSlug;
    return `${tour}|${rk}|slot-${slot}|${m.teamASlug}|${m.teamBSlug}|${m.date?.slice(0, 10) ?? ""}`;
  }
  return `${m.tournamentSlug}|${m.teamASlug}|${m.teamBSlug}|${m.date?.slice(0, 10) ?? ""}`;
}
