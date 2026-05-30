import { getMatchStageMeta, type StageRoundKey } from "./match-stage-meta";

/** Puntos por acertar — escalado por fase (sincronizado con admin / prediction_scoring.rules). */
export type PickemStagePointsConfig = {
  group: number;
  quarter: number;
  semi: number;
  final: number;
};

export const DEFAULT_PICKEM_STAGE_POINTS: PickemStagePointsConfig = {
  group: 35,
  quarter: 55,
  semi: 70,
  final: 85,
};

const ROUND_TO_KEY: Record<StageRoundKey, keyof PickemStagePointsConfig> = {
  group: "group",
  last_chance: "group",
  other: "group",
  quarter: "quarter",
  semi: "semi",
  final: "final",
  grand_final: "final",
};

export function parsePickemStagePointsFromRules(
  rules: Record<string, unknown> | null | undefined,
): PickemStagePointsConfig {
  if (!rules || typeof rules !== "object") return { ...DEFAULT_PICKEM_STAGE_POINTS };
  const n = (k: keyof PickemStagePointsConfig, fallback: number) => {
    const v = rules[`points_${k}`];
    return typeof v === "number" && v > 0 ? v : fallback;
  };
  return {
    group: n("group", DEFAULT_PICKEM_STAGE_POINTS.group),
    quarter: n("quarter", DEFAULT_PICKEM_STAGE_POINTS.quarter),
    semi: n("semi", DEFAULT_PICKEM_STAGE_POINTS.semi),
    final: n("final", DEFAULT_PICKEM_STAGE_POINTS.final),
  };
}

export function getPickemRewardPoints(
  stage: string,
  format?: string,
  config: PickemStagePointsConfig = DEFAULT_PICKEM_STAGE_POINTS,
): number {
  const meta = getMatchStageMeta(stage);
  const key = ROUND_TO_KEY[meta.roundKey];
  if (key !== "group" || meta.roundKey !== "other") {
    return config[key];
  }
  if (format?.includes("5")) return config.final;
  if (format?.includes("3")) return config.quarter;
  return config.group;
}

export const PICKEM_STAGE_OPTIONS = [
  { id: "Group Stage", label: "Jornada / grupos (partido normal)", pointsKey: "group" as const },
  { id: "Quarterfinal", label: "Cuartos de final", pointsKey: "quarter" as const },
  { id: "Semifinal", label: "Semifinal (partido clave)", pointsKey: "semi" as const },
  { id: "Grand Final", label: "Gran final", pointsKey: "final" as const },
] as const;
