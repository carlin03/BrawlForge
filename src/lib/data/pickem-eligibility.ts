import type { EsportsMatch } from "./esports-match-types";
import { isPendingTeamSlug } from "./match-meta";
import { getMatchStageMeta } from "./match-stage-meta";
import { getTeam } from "./teams";
import { isValidLogoSlug } from "./logo-slugs";
import { isSchedulableMatch, isSchedulableTeamSlug } from "./team-display-resolve";

export function isKnownTeamSlug(slug: string): boolean {
  if (!isValidLogoSlug(slug)) return false;
  return !!getTeam(slug);
}

/** Ambos equipos en catálogo local/CMS. */
export function isDisplayableMatch(m: EsportsMatch): boolean {
  return isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug);
}

/** Calendario público: slug válido aunque el equipo no esté creado en admin. */
export { isSchedulableMatch, isSchedulableTeamSlug } from "./team-display-resolve";

function slugOkForPickem(slug: string): boolean {
  return isKnownTeamSlug(slug) || isPendingTeamSlug(slug);
}

/** Pick'em / predicciones: cuartos con equipos reales; semis/final pueden usar winner-qf-* / winner-sf-*. */
export function isPickemMatchEligible(m: EsportsMatch): boolean {
  const round = getMatchStageMeta(m.stage).roundKey;
  if (round === "quarter") {
    return isSchedulableMatch(m);
  }
  if (round === "semi" || round === "final" || round === "grand_final") {
    return slugOkForPickem(m.teamASlug) && slugOkForPickem(m.teamBSlug);
  }
  return isSchedulableMatch(m);
}
