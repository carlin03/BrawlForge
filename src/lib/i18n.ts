import type { EsportsTournament } from "./data/matches";

export function tournamentStatusLabel(status: EsportsTournament["status"]): string {
  if (status === "live") return "En vivo";
  if (status === "upcoming") return "Próximo";
  return "Finalizado";
}
