import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import type { EsportsMatch } from "./matches";
import { isDisplayableMatch } from "./matches";
import { getMatchPool } from "./match-pool";
import { getMatchStageMeta } from "./match-stage-meta";

const CURATED_IDS = new Set(BSC_UPCOMING_PREDICTION_MATCHES.map((m) => m.id));

/** Partidos abiertos para Pick'em: calendario curado + CMS (admin con fase). */
export function getPickemOpenMatches(): EsportsMatch[] {
  const pool = getMatchPool();
  const byId = new Map<string, EsportsMatch>();

  for (const m of BSC_UPCOMING_PREDICTION_MATCHES) {
    if (isDisplayableMatch(m) && (m.status === "upcoming" || m.status === "live")) {
      byId.set(m.id, m);
    }
  }

  for (const m of pool) {
    if (m.status !== "upcoming" && m.status !== "live") continue;
    if (!isDisplayableMatch(m)) continue;

    const meta = getMatchStageMeta(m.stage || "");
    const fromAdmin = Boolean(m.stage?.trim());
    const isCurated = CURATED_IDS.has(m.id);

    if (isCurated || fromAdmin || meta.isPlayoff || meta.roundKey === "group") {
      byId.set(m.id, m);
    }
  }

  // Calendario curado gana siempre (evita perder semis/final en CMS incompleto)
  for (const m of BSC_UPCOMING_PREDICTION_MATCHES) {
    if ((m.status === "upcoming" || m.status === "live") && isDisplayableMatch(m)) {
      byId.set(m.id, m);
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
