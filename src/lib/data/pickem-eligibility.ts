import type { EsportsMatch } from "./esports-match-types";
import { isPendingTeamSlug } from "./match-meta";
import { getMatchStageMeta } from "./match-stage-meta";
import { getTeam } from "./teams";
import { isValidLogoSlug } from "./logo-slugs";

export function isKnownTeamSlug(slug: string): boolean {
  if (!isValidLogoSlug(slug)) return false;
  return !!getTeam(slug);
}

export function isDisplayableMatch(m: EsportsMatch): boolean {
  return isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug);
}

function slugOkForPickem(slug: string): boolean {
  return isKnownTeamSlug(slug) || isPendingTeamSlug(slug);
}

/** Pick'em / predicciones: cuartos con equipos reales; semis/final pueden usar winner-qf-* / winner-sf-*. */
export function isPickemMatchEligible(m: EsportsMatch): boolean {
  const round = getMatchStageMeta(m.stage).roundKey;
  if (round === "quarter") {
    return isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug);
  }
  if (round === "semi" || round === "final" || round === "grand_final") {
    return slugOkForPickem(m.teamASlug) && slugOkForPickem(m.teamBSlug);
  }
  return isDisplayableMatch(m);
}
