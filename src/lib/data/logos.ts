import { BSC_DEFAULT_LOGO } from "./bsc-tournaments";
import { TEAM_LOGOS, buildRemoteLogoChain } from "./team-logo-urls";
import { buildTournamentRemoteLogoChain, getTournamentLogoFilename } from "./tournament-logos";

export { TEAM_LOGOS };

export function getTeamLogo(slug: string): string | undefined {
  const chain = buildRemoteLogoChain(slug);
  return chain[0] ?? TEAM_LOGOS[slug];
}

export function getTournamentLogo(slug: string): string | undefined {
  const remote = buildTournamentRemoteLogoChain(slug);
  return remote[0] ?? BSC_DEFAULT_LOGO;
}

export {
  getTournamentLogoFilename,
  getTournamentLogoRemote,
  liquipediaCommonsUrl,
} from "./tournament-logos";
