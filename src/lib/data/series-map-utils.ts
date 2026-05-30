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

/** Mapas visibles antes de marcador decisivo (BO3→2, BO5→3, BO7→4). */
export function initialMapsVisibleCount(format: string): number {
  const f = format.toLowerCase();
  if (f.includes("7")) return 4;
  if (f.includes("5")) return 3;
  if (f.includes("1")) return 1;
  return 2;
}

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

/** ¿Marcador exacto fuerza mapa decisivo? (1-1, 2-2, 3-3) */
export function isDecisiveExactScore(exact: string | undefined, format: string): boolean {
  return decisiveMapIndexFromExactString(exact, format) != null;
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

/** Slots completos del pool (análisis de mapas). */
export function allSeriesMapSlots(
  order: string[],
  exactScore: string | undefined,
  manualDecisive: string | undefined,
  format: string,
): MapSeriesSlot[] {
  const decisiveIdx = decisiveMapIndexFromExactString(exactScore, format);
  return mapOrderWithDecisive(order, decisiveIdx, manualDecisive, format);
}

/**
 * Mapas para predicción avanzada (ganador por mapa): solo los relevantes según formato y marcador.
 * BO3: 1–2; con 1-1 aparece mapa 3. BO5: 1–3; con 2-2 mapa 5. BO7: 1–4; con 3-3 mapa 7.
 */
export function visiblePredictionMapSlots(
  order: string[],
  exactScore: string | undefined,
  manualDecisive: string | undefined,
  format: string,
): MapSeriesSlot[] {
  const all = allSeriesMapSlots(order, exactScore, manualDecisive, format);
  const decisiveIdx = decisiveMapIndexFromExactString(exactScore, format);
  const initialMax = initialMapsVisibleCount(format) - 1;
  const maxVisible = decisiveIdx != null ? Math.max(initialMax, decisiveIdx) : initialMax;
  return all.filter((s) => s.index <= maxVisible);
}
