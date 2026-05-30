import { getSeriesRules, parseExactScore } from "./match-format-rules";

export type MapSeriesSlot = {
  name: string;
  index: number;
  decisive: boolean;
};

export function maxMapsInSeries(format: string): number {
  const f = format.toLowerCase();
  if (f.includes("7")) return 7;
  if (f.includes("5")) return 5;
  if (f.includes("1")) return 1;
  return 3;
}

/** Índice 0-based del mapa decisivo cuando el marcador exacto fuerza último mapa (1-1, 2-2, 3-3). */
export function decisiveMapIndexFromSeriesScore(
  scoreA: number,
  scoreB: number,
  format: string,
): number | null {
  const { winsNeeded, maxMapsLosers } = getSeriesRules(format);
  if (scoreA === winsNeeded && scoreB === maxMapsLosers) return scoreA + scoreB - 1;
  if (scoreB === winsNeeded && scoreA === maxMapsLosers) return scoreA + scoreB - 1;
  return null;
}

export function decisiveMapIndexFromExactString(
  exact: string | undefined,
  format: string,
): number | null {
  const p = parseExactScore(exact);
  if (!p) return null;
  return decisiveMapIndexFromSeriesScore(p.a, p.b, format);
}

export function mapOrderWithDecisive(
  order: string[],
  decisiveIndex: number | null,
  manualDecisive?: string,
  format?: string,
): MapSeriesSlot[] {
  const cap = format ? maxMapsInSeries(format) : order.length;
  const names = order.filter(Boolean).slice(0, cap);
  return names.map((name, index) => ({
    name,
    index,
    decisive:
      (decisiveIndex != null && index === decisiveIndex) ||
      (!!manualDecisive && name === manualDecisive),
  }));
}
