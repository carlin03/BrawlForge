import {
  getSeriesRules,
  isValidSeriesScore,
  parseExactScore,
} from "./match-format-rules";
import type { MatchMeta } from "./match-meta";

/** Orden BO3 por defecto (nombres BSC habituales) si el partido no tiene mapas en meta. */
const DEFAULT_ORDER_BO3 = ["Triple Dribble", "Sneaky Fields", "Center Stage"] as const;
const DEFAULT_ORDER_BO5 = [
  "Gem Fort",
  "Center Stage",
  "Hot Zone",
  "Bridge Too Far",
  "Layer Cake",
] as const;
const DEFAULT_ORDER_BO7 = [
  ...DEFAULT_ORDER_BO5,
  "Double Swoosh",
  "Kaboom Canyon",
] as const;

/** Mapas del partido para predicciones (meta → pool → plantilla por formato). */
export function resolveMatchMapOrder(meta: MatchMeta | undefined, format: string): string[] {
  const maps = meta?.maps;
  const order = maps?.order?.map((n) => n.trim()).filter(Boolean) ?? [];
  if (order.length) return order;

  const possible = maps?.possible?.map((n) => n.trim()).filter(Boolean) ?? [];
  if (possible.length) {
    return possible.slice(0, maxMapsInSeries(format));
  }

  const played = maps?.played?.map((p) => p.name.trim()).filter(Boolean) ?? [];
  if (played.length) return played;

  const f = format.toLowerCase();
  if (f.includes("7")) return [...DEFAULT_ORDER_BO7];
  if (f.includes("5")) return [...DEFAULT_ORDER_BO5];
  if (f.includes("1")) return [DEFAULT_ORDER_BO3[0]];
  return [...DEFAULT_ORDER_BO3];
}

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
 * Mapas que se juegan según marcador exacto (regla BSC).
 * BO3 2-0 → 2 mapas · 2-1 → 3 · BO5 3-0 → 3 · 3-2 → 5 · BO7 4-3 → 7, etc.
 */
export function mapCountFromExactScore(
  exactScore: string | undefined,
  format: string,
): number | null {
  const p = parseExactScore(exactScore);
  if (!p || !isValidSeriesScore(p.a, p.b, format)) return null;
  return p.a + p.b;
}

/**
 * Mapas visibles para predecir: dependen del marcador exacto elegido.
 * Sin marcador válido no se muestran mapas (hay que elegir resultado exacto antes).
 */
export function visiblePredictionMapSlots(
  order: string[],
  exactScore: string | undefined,
  manualDecisive: string | undefined,
  format: string,
): MapSeriesSlot[] {
  const count = mapCountFromExactScore(exactScore, format);
  if (count == null) return [];

  const all = allSeriesMapSlots(order, exactScore, manualDecisive, format);
  return all.filter((s) => s.index < count);
}

/** Misma visibilidad que predicciones (análisis de mapa alineado con la serie predicha). */
export function visibleAnalysisMapSlots(
  order: string[],
  exactScore: string | undefined,
  manualDecisive: string | undefined,
  format: string,
): MapSeriesSlot[] {
  return visiblePredictionMapSlots(order, exactScore, manualDecisive, format);
}
