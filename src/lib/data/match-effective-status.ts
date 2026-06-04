import { parseMatchMeta } from "./match-meta";
import type { EsportsMatch } from "./esports-match-types";

const FINISH_GRACE_MS = 3 * 60 * 60 * 1000;
/** Pick'em cerrado tras la hora del partido + margen (evita partidos “abiertos” de hace días). */
const PICKEM_CLOSE_MS = 8 * 60 * 60 * 1000;
/** Tras una semana sin actualizar CMS, el partido deja de estar abierto. */
const PICKEM_STALE_MS = 7 * 24 * 60 * 60 * 1000;

function metaSaysFinished(meta: ReturnType<typeof parseMatchMeta>): boolean {
  const sync = (meta as { sync?: { completed?: boolean } }).sync;
  if (sync?.completed === true) return true;
  if (meta.display_status === "finished" || meta.display_status === "cancelled") return true;
  return false;
}

function hasDecisiveScore(m: EsportsMatch): boolean {
  if (m.scoreA === m.scoreB) return false;
  if (m.status === "finished") return true;
  return m.scoreA > 0 || m.scoreB > 0;
}

/** Estado real para listados y pick'em (respeta DB + marcador + hora + sync). */
export function getEffectiveMatchStatus(m: EsportsMatch): EsportsMatch["status"] {
  if (m.status === "cancelled") return "cancelled";
  if (m.status === "finished") return "finished";

  const meta = parseMatchMeta(m.meta);
  if (metaSaysFinished(meta)) return "finished";

  if (hasDecisiveScore(m) && m.status !== "live") return "finished";

  if (m.status === "live") return "live";

  const scheduled = new Date(m.date).getTime();
  const pastGrace = !Number.isNaN(scheduled) && Date.now() > scheduled + FINISH_GRACE_MS;
  const pastStale = !Number.isNaN(scheduled) && Date.now() > scheduled + PICKEM_STALE_MS;

  if (pastGrace && hasDecisiveScore(m)) return "finished";

  if (pastGrace && m.status === "upcoming") return "finished";

  if (pastStale) return "finished";

  return m.status;
}

export function withEffectiveMatchStatus(m: EsportsMatch): EsportsMatch {
  const status = getEffectiveMatchStatus(m);
  return status === m.status ? m : { ...m, status };
}

export function isPickemMatchOpen(m: EsportsMatch): boolean {
  const status = getEffectiveMatchStatus(m);
  if (status === "finished" || status === "cancelled") return false;

  const scheduled = new Date(m.date).getTime();
  if (
    !Number.isNaN(scheduled) &&
    (Date.now() > scheduled + PICKEM_CLOSE_MS || Date.now() > scheduled + PICKEM_STALE_MS) &&
    status !== "live"
  ) {
    return false;
  }

  return status === "upcoming" || status === "live";
}
