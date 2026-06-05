import type { EsportsMatch } from "./esports-match-types";
import {
  applyDefaultPredictionsToMeta,
  DEFAULT_BRAWLER_POOL,
  DEFAULT_MAP_POOL,
  parseMatchMeta,
} from "./match-meta";
import { enrichFinishedMatchResults } from "./finish-match-results-enrich";
import { fixMislabeledWorldFinalsSlug } from "./tournament-slug-sanitize";
import { getEffectiveMatchStatus } from "./match-effective-status";
import {
  applyTemplateToMatchForm,
  DEFAULT_TOURNAMENT_MATCH_TEMPLATES,
  suggestTemplateForTournament,
} from "./tournament-match-templates";

/** Mapas, brawlers y puntos de predicción por defecto para todo partido público. */
export function enrichMatchForPool(m: EsportsMatch): EsportsMatch {
  m = fixMislabeledWorldFinalsSlug(m);
  let meta = applyDefaultPredictionsToMeta(parseMatchMeta(m.meta));

  if (m.id.startsWith("lp-") && meta.schedule_trust !== "template") {
    meta = { ...meta, schedule_trust: meta.schedule_trust ?? "confirmed" };
  }

  const tpl = suggestTemplateForTournament(m.tournamentSlug, DEFAULT_TOURNAMENT_MATCH_TEMPLATES);
  const applied = tpl ? applyTemplateToMatchForm(tpl) : null;
  const format = m.format?.trim() || applied?.format || "Bo5";

  if (!meta.maps?.order?.length) {
    const pool = applied?.map_pool.length ? applied.map_pool : [...DEFAULT_MAP_POOL];
    const order = applied?.map_order.length ? applied.map_order : pool.slice(0, format.includes("7") ? 7 : format.includes("5") ? 5 : 3);
    meta = {
      ...meta,
      maps: {
        ...meta.maps,
        possible: pool,
        order,
        decisive: applied?.map_decisive || meta.maps?.decisive,
      },
    };
  }

  if (!meta.brawlers?.recommended?.length) {
    meta = {
      ...meta,
      brawlers: {
        ...meta.brawlers,
        recommended: [...DEFAULT_BRAWLER_POOL],
        most_used: meta.brawlers?.most_used ?? [...DEFAULT_BRAWLER_POOL.slice(0, 6)],
      },
    };
  }

  const effectiveStatus = getEffectiveMatchStatus({ ...m, meta, format });
  if (effectiveStatus === "finished") {
    meta = enrichFinishedMatchResults({ ...m, meta, format, status: effectiveStatus }, meta);
  }

  return { ...m, meta, format };
}
