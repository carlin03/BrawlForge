import { bsc2026Tournaments } from "./bsc-tournaments";
import type { EsportsTournament } from "./matches";

const STATUS_ORDER: Record<EsportsTournament["status"], number> = { live: 0, upcoming: 1, finished: 2 };

/** Todos los eventos BSC 2026 curados para el home */
export function getHomeTournaments(limit?: number): EsportsTournament[] {
  const sorted = [...bsc2026Tournaments].sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    if (a.status === "finished") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
  return limit ? sorted.slice(0, limit) : sorted;
}
