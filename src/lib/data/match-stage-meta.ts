/** Importancia de ronda y copy competitivo para Pick'em / predicciones */

import { MATCH_ROUND_OPTIONS } from "./match-round-types";

export type StageRoundKey =
  | "group"
  | "last_chance"
  | "quarter"
  | "semi"
  | "final"
  | "grand_final"
  | "other";

export type StageTier = 1 | 2 | 3 | 4 | 5;

export interface MatchStageMeta {
  tier: StageTier;
  roundKey: StageRoundKey;
  /** Etiqueta corta en badge (español) */
  label: string;
  /** Nombre largo para contexto */
  fullLabel: string;
  badgeClass: string;
  cardClass: string;
  isPlayoff: boolean;
  stakesLine: string;
}

const STAKES: Record<StageRoundKey, string> = {
  group: "Puntos en la fase de grupos",
  last_chance: "Última oportunidad de clasificar al bracket",
  quarter: "El ganador avanza a semifinales",
  semi: "A un paso de la gran final",
  final: "El campeón del torneo se decide aquí",
  grand_final: "Título y máximo prestigio en juego",
  other: "Encuentro del calendario competitivo",
};

export function getMatchStageMeta(stage: string): MatchStageMeta {
  const raw = (stage || "Match").trim();
  const s = raw.toLowerCase();

  const preset = MATCH_ROUND_OPTIONS.find((o) => o.id === raw);
  if (preset) {
    const tier =
      preset.roundKey === "grand_final"
        ? 5
        : preset.roundKey === "semi" || preset.roundKey === "final"
          ? 4
          : preset.roundKey === "quarter"
            ? 3
            : preset.roundKey === "group"
              ? 1
              : 2;
    return {
      tier: tier as StageTier,
      roundKey: preset.roundKey,
      label: preset.filterLabel,
      fullLabel: preset.label,
      badgeClass: `is-round-${preset.roundKey}`,
      cardClass: `is-tier-${tier}`,
      isPlayoff: preset.isPlayoff,
      stakesLine: STAKES[preset.roundKey],
    };
  }

  let roundKey: StageRoundKey = "other";
  let tier: StageTier = 2;
  let label = raw;
  let fullLabel = raw;

  if (/grand\s*final|^gf$|gran\s*final/i.test(s)) {
    roundKey = "grand_final";
    tier = 5;
    label = "Gran Final";
    fullLabel = "Gran Final";
  } else if (/semi\s*-?\s*final|semifinal/i.test(s)) {
    roundKey = "semi";
    tier = 4;
    label = "Semifinal";
    fullLabel = "Semifinales";
  } else if (/quarter\s*-?\s*final|quarterfinal|cuartos/i.test(s)) {
    roundKey = "quarter";
    tier = 3;
    label = "Cuartos";
    fullLabel = "Cuartos de final";
  } else if (/last\s*chance|última\s*oportunidad/i.test(s)) {
    roundKey = "last_chance";
    tier = 2;
    label = "Last Chance";
    fullLabel = "Last Chance Qualifier";
  } else if (/^group\s+[a-z0-9]/i.test(s) || /^grupo\s/i.test(s) || s === "group stage") {
    roundKey = "group";
    tier = 1;
    const m = raw.match(/group\s+([a-z0-9]+)/i) || raw.match(/grupo\s+([a-z0-9]+)/i);
    label = m ? `Grupo ${m[1].toUpperCase()}` : "Grupos";
    fullLabel = label;
  } else if (/\bgroup\b|\bgrupo\b/i.test(s)) {
    roundKey = "group";
    tier = 1;
    label = "Fase de grupos";
    fullLabel = "Fase de grupos";
  } else if (/\bfinal\b/i.test(s) && !/quarter|semi|grand/i.test(s)) {
    roundKey = "final";
    tier = 4;
    label = "Final";
    fullLabel = "Final";
  } else if (/monthly\s*final|regional\s*final|world\s*final/i.test(s)) {
    roundKey = "final";
    tier = 4;
    label = "Final";
    fullLabel = raw;
  } else if (/play-?in|wildcard|lower\s*bracket|upper\s*bracket/i.test(s)) {
    roundKey = "last_chance";
    tier = 2;
    label = "Play-in";
    fullLabel = raw;
  } else if (/round\s*of\s*16|octavos/i.test(s)) {
    roundKey = "quarter";
    tier = 3;
    label = "Octavos";
    fullLabel = "Octavos de final";
  }

  const isPlayoff = roundKey === "quarter" || roundKey === "semi" || roundKey === "final" || roundKey === "grand_final";

  return {
    tier,
    roundKey,
    label,
    fullLabel,
    badgeClass: `is-round-${roundKey}`,
    cardClass: `is-tier-${tier}`,
    isPlayoff,
    stakesLine: STAKES[roundKey],
  };
}

export type PredictDisplayStatus = "live" | "upcoming" | "open" | "closed" | "finished";

export function getPredictDisplayStatus(opts: {
  eventStatus: "open" | "closed";
  matchStatus?: string;
}): PredictDisplayStatus {
  if (opts.eventStatus === "closed") {
    return opts.matchStatus === "finished" ? "finished" : "closed";
  }
  if (opts.matchStatus === "live") return "live";
  if (opts.matchStatus === "upcoming") return "open";
  return "open";
}

export const PREDICT_STATUS_LABELS: Record<
  PredictDisplayStatus,
  { label: string; emoji: string; className: string }
> = {
  live: { label: "En vivo", emoji: "🟢", className: "is-live" },
  upcoming: { label: "Próximo", emoji: "🔵", className: "is-upcoming" },
  open: { label: "Predicción abierta", emoji: "🟡", className: "is-open" },
  closed: { label: "Cerrado", emoji: "⚫", className: "is-closed" },
  finished: { label: "Finalizado", emoji: "🔴", className: "is-finished" },
};

export function stageImportanceSort<T extends { stage: string; totalVotes?: number; rewardPoints?: number }>(
  a: T,
  b: T,
): number {
  const ta = getMatchStageMeta(a.stage).tier;
  const tb = getMatchStageMeta(b.stage).tier;
  if (tb !== ta) return tb - ta;
  const va = a.totalVotes ?? 0;
  const vb = b.totalVotes ?? 0;
  if (vb !== va) return vb - va;
  return (b.rewardPoints ?? 0) - (a.rewardPoints ?? 0);
}
