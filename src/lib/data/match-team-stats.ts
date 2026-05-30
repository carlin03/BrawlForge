import type { EsportsMatch } from "./matches";
import { matches } from "./matches";
import { getTeam, teamName } from "./index";

export type TeamMatchStats = {
  wins: number;
  losses: number;
  played: number;
  winRate: number;
  form: ("W" | "L")[];
  recent: EsportsMatch[];
};

export type H2HStats = {
  total: number;
  winsA: number;
  winsB: number;
  matches: EsportsMatch[];
};

function teamWon(m: EsportsMatch, slug: string): boolean {
  if (m.status !== "finished") return false;
  if (m.teamASlug === slug) return m.scoreA > m.scoreB;
  if (m.teamBSlug === slug) return m.scoreB > m.scoreA;
  return false;
}

export function getTeamMatchStats(slug: string, limit = 8): TeamMatchStats {
  const finished = matches
    .filter((m) => m.status === "finished" && (m.teamASlug === slug || m.teamBSlug === slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let wins = 0;
  let losses = 0;
  const form: ("W" | "L")[] = [];

  for (const m of finished.slice(0, limit)) {
    const w = teamWon(m, slug);
    if (w) wins++;
    else losses++;
    form.push(w ? "W" : "L");
  }

  const played = wins + losses;
  const team = getTeam(slug);
  const formFromTeam = team?.form?.length ? team.form : form;

  return {
    wins,
    losses,
    played,
    winRate: played ? Math.round((wins / played) * 100) : 0,
    form: formFromTeam.slice(0, 5),
    recent: finished.slice(0, limit),
  };
}

export function getH2HStats(teamA: string, teamB: string, excludeId?: string): H2HStats {
  const h2h = matches.filter(
    (m) =>
      m.id !== excludeId &&
      m.status === "finished" &&
      ((m.teamASlug === teamA && m.teamBSlug === teamB) ||
        (m.teamASlug === teamB && m.teamBSlug === teamA)),
  );

  let winsA = 0;
  let winsB = 0;
  for (const m of h2h) {
    if (teamWon(m, teamA)) winsA++;
    else winsB++;
  }

  return {
    total: h2h.length,
    winsA,
    winsB,
    matches: h2h.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
  };
}

export function formatRecentScore(m: EsportsMatch, ourSlug: string): string {
  const vs = m.teamASlug === ourSlug ? m.teamBSlug : m.teamASlug;
  const ourScore = m.teamASlug === ourSlug ? m.scoreA : m.scoreB;
  const theirScore = m.teamASlug === ourSlug ? m.scoreB : m.scoreA;
  const w = ourScore > theirScore;
  return `${w ? "W" : "L"} vs ${teamName(vs)} · ${ourScore}-${theirScore}`;
}
