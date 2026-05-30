import type { StageRoundKey } from "./match-stage-meta";

/** Tipos de ronda configurables en Admin (campo stage / matches_catalog.stage). */
export const MATCH_ROUND_OPTIONS = [
  { id: "Group Stage", label: "Group Stage", filterLabel: "Grupos", roundKey: "group" as StageRoundKey, isPlayoff: false },
  { id: "Swiss Stage", label: "Swiss Stage", filterLabel: "Swiss", roundKey: "group" as StageRoundKey, isPlayoff: false },
  { id: "Round of 16", label: "Round of 16", filterLabel: "Octavos", roundKey: "quarter" as StageRoundKey, isPlayoff: true },
  { id: "Quarterfinal", label: "Quarterfinal", filterLabel: "Cuartos", roundKey: "quarter" as StageRoundKey, isPlayoff: true },
  { id: "Semifinal", label: "Semifinal", filterLabel: "Semis", roundKey: "semi" as StageRoundKey, isPlayoff: true },
  { id: "Grand Final", label: "Grand Final", filterLabel: "Final", roundKey: "grand_final" as StageRoundKey, isPlayoff: true },
  { id: "Third Place Match", label: "3er puesto", filterLabel: "3er puesto", roundKey: "final" as StageRoundKey, isPlayoff: true },
  { id: "Upper Bracket", label: "Upper Bracket", filterLabel: "Upper", roundKey: "quarter" as StageRoundKey, isPlayoff: true },
  { id: "Lower Bracket", label: "Lower Bracket", filterLabel: "Lower", roundKey: "quarter" as StageRoundKey, isPlayoff: true },
  { id: "Winner Bracket", label: "Winner Bracket", filterLabel: "Winner", roundKey: "semi" as StageRoundKey, isPlayoff: true },
  { id: "Loser Bracket", label: "Loser Bracket", filterLabel: "Loser", roundKey: "semi" as StageRoundKey, isPlayoff: true },
  { id: "Showmatch", label: "Showmatch", filterLabel: "Showmatch", roundKey: "other" as StageRoundKey, isPlayoff: false },
  { id: "Friendly", label: "Friendly", filterLabel: "Amistoso", roundKey: "other" as StageRoundKey, isPlayoff: false },
] as const;

export type MatchRoundId = (typeof MATCH_ROUND_OPTIONS)[number]["id"];

export type PredictRoundFilterKey = "all" | "group" | "quarter" | "semi" | "final";

export const PREDICT_ROUND_FILTER_OPTIONS: { id: PredictRoundFilterKey; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "group", label: "Grupos" },
  { id: "quarter", label: "Cuartos" },
  { id: "semi", label: "Semis" },
  { id: "final", label: "Final" },
];

export function roundKeyFromStage(stage: string): StageRoundKey {
  const hit = MATCH_ROUND_OPTIONS.find((o) => o.id === stage);
  if (hit) return hit.roundKey;
  return "other";
}

export function filterKeyFromRoundKey(key: StageRoundKey): PredictRoundFilterKey | null {
  if (key === "group" || key === "last_chance" || key === "other") return "group";
  if (key === "quarter") return "quarter";
  if (key === "semi") return "semi";
  if (key === "final" || key === "grand_final") return "final";
  return null;
}

export function filterKeyFromStage(stage: string): PredictRoundFilterKey | null {
  const hit = MATCH_ROUND_OPTIONS.find((o) => o.id === stage);
  if (hit) return filterKeyFromRoundKey(hit.roundKey);
  return null;
}
