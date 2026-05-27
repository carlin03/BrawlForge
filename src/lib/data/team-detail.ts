import { getGeneratedTournaments, isTierBPlus } from "./catalog";
import { getTournament, matches, type EsportsTournament } from "./matches";
import { getTeam } from "./teams";

export interface TeamTournamentRow {
  slug: string;
  name: string;
  shortName: string;
  prizePool: string;
  status: EsportsTournament["status"];
  tier?: number;
  played: number;
  wins: number;
  losses: number;
}

export function getTeamTournamentHistory(teamSlug: string, limit = 12): TeamTournamentRow[] {
  const playedSlugs = new Set<string>();
  for (const m of matches) {
    if (m.teamASlug === teamSlug || m.teamBSlug === teamSlug) {
      playedSlugs.add(m.tournamentSlug);
    }
  }

  const rows: TeamTournamentRow[] = [];

  for (const slug of playedSlugs) {
    const t = getTournament(slug);
    if (!t) continue;
    const teamMatches = matches.filter(
      (m) => m.tournamentSlug === slug && (m.teamASlug === teamSlug || m.teamBSlug === teamSlug),
    );
    const finished = teamMatches.filter((m) => m.status === "finished");
    let wins = 0;
    let losses = 0;
    for (const m of finished) {
      const isA = m.teamASlug === teamSlug;
      const won = isA ? m.scoreA > m.scoreB : m.scoreB > m.scoreA;
      if (won) wins++;
      else losses++;
    }
    rows.push({
      slug,
      name: t.name.replace(/<!--[\s\S]*?-->/g, "").trim(),
      shortName: t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim(),
      prizePool: t.prizePool,
      status: t.status,
      tier: t.tier,
      played: teamMatches.length,
      wins,
      losses,
    });
  }

  return rows
    .sort((a, b) => b.played - a.played || (a.tier ?? 9) - (b.tier ?? 9))
    .slice(0, limit);
}

export function getTeamLiquipediaUrl(slug: string): string | null {
  const team = getTeam(slug);
  if (!team?.liquipediaUrl) return null;
  return team.liquipediaUrl;
}

export function getTeamRegisteredTournaments(teamSlug: string, limit = 8): EsportsTournament[] {
  const out: EsportsTournament[] = [];
  for (const gt of getGeneratedTournaments()) {
    const participants = gt.participantSlugs ?? [];
    if (participants.some((p) => p === teamSlug || p.replace(/^team/, "") === teamSlug)) {
      const t = getTournament(gt.slug);
      if (t && (isTierBPlus(t) || t.featured)) out.push(t);
    }
  }
  return out.slice(0, limit);
}
