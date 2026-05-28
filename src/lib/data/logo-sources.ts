export { resolveTournamentSlug } from "./catalog";
export {
  resolveTeamLogoSlug,
  teamLogoSources,
  tournamentLogoSources,
  teamPngSources,
  tournamentPngSources,
} from "./png-logo-urls";

import { teamLogoSources, tournamentLogoSources } from "./png-logo-urls";

export function buildTeamLogoSources(slug: string): string[] {
  return teamLogoSources(slug);
}

export function buildTournamentLogoSources(slug: string): string[] {
  return tournamentLogoSources(slug);
}
