import { getTournament } from "@/lib/data/matches";
import { matches } from "@/lib/data/matches";
import type { Region } from "@/lib/types";
import type { RosterPlayerStats } from "@/lib/data/entity-stats";
import type { TeamTournamentRow } from "@/lib/data/team-detail";

function teamFinishedMatches(teamSlug: string) {
  return matches
    .filter((m) => m.status === "finished" && (m.teamASlug === teamSlug || m.teamBSlug === teamSlug))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function matchWon(m: { teamASlug: string; teamBSlug: string; scoreA: number; scoreB: number }, teamSlug: string) {
  const isA = m.teamASlug === teamSlug;
  return isA ? m.scoreA > m.scoreB : m.scoreB > m.scoreA;
}

export type TeamSponsorEntry = {
  name: string;
  category?: string;
  logo_url?: string;
};

export function parseTeamSponsors(raw: unknown): TeamSponsorEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) return { name: item.trim() };
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const name = String(o.name ?? o.title ?? "").trim();
      if (!name) return null;
      return {
        name,
        category: o.category ? String(o.category) : undefined,
        logo_url: o.logo_url ? String(o.logo_url) : undefined,
      };
    })
    .filter((x): x is TeamSponsorEntry => Boolean(x));
}

export type TeamOrgInfo = {
  founded: string | null;
  country: string | null;
  region: Region;
  peakRank: number | null;
  coach: string | null;
  manager: string | null;
  ceo: string | null;
  totalPrizes: string;
  tournamentsWon: number;
  titles: number;
};

export function getTeamOrgInfo(
  team: {
    country: string;
    region: Region;
    earnings: number;
    rank: number;
    achievements: unknown[];
    foundedYear?: number | null;
    coach?: string | null;
    meta?: Record<string, unknown>;
  },
  founded: string | null,
  coach: string | null,
  profile?: { manager?: string; ceo?: string; peak_rank?: number },
): TeamOrgInfo {
  const meta = team.meta ?? {};
  const peakRank =
    profile?.peak_rank ??
    (typeof meta.peak_rank === "number"
      ? meta.peak_rank
      : typeof meta.best_rank === "number"
        ? meta.best_rank
        : team.rank > 0
          ? team.rank
          : null);
  return {
    founded,
    country: team.country || null,
    region: team.region,
    peakRank,
    coach,
    manager: profile?.manager ?? (typeof meta.manager === "string" ? meta.manager : null),
    ceo: profile?.ceo ?? (typeof meta.ceo === "string" ? meta.ceo : null),
    totalPrizes: `$${(team.earnings / 1000).toFixed(0)}K`,
    tournamentsWon: team.achievements.length,
    titles: team.achievements.length,
  };
}

export type FeaturedPlayerHighlight = {
  id: string;
  badge: string;
  title: string;
  player: RosterPlayerStats;
};

export function getFeaturedPlayers(roster: RosterPlayerStats[]): FeaturedPlayerHighlight[] {
  if (!roster.length) return [];
  const out: FeaturedPlayerHighlight[] = [];

  const mvp = roster.find((r) => r.star) ?? roster[0];
  out.push({
    id: "mvp",
    badge: "MVP",
    title: "MVP del equipo",
    player: mvp,
  });

  const bestWr = [...roster].sort((a, b) => b.winRate - a.winRate)[0];
  if (bestWr && bestWr.slug !== mvp.slug) {
    out.push({
      id: "wr",
      badge: "WR",
      title: "Mejor win rate",
      player: bestWr,
    });
  }

  const topOvr = [...roster].sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  if (topOvr && !out.some((h) => h.player.slug === topOvr.slug)) {
    out.push({
      id: "ovr",
      badge: "OVR",
      title: "Mayor OVR",
      player: topOvr,
    });
  }

  const revelation = [...roster]
    .filter((r) => !r.star && r.rosterRank > 1)
    .sort((a, b) => {
      const scoreA = a.form.filter((f) => f === "W").length * 10 + a.rating * 5;
      const scoreB = b.form.filter((f) => f === "W").length * 10 + b.rating * 5;
      return scoreB - scoreA;
    })[0];
  if (revelation && !out.some((h) => h.player.slug === revelation.slug)) {
    out.push({
      id: "rising",
      badge: "★",
      title: "Jugador revelación",
      player: revelation,
    });
  }

  return out.slice(0, 4);
}

export type TourFilterId = "all" | "bsc" | "monthly" | "world" | "snapdragon" | "esl" | "other";

export const TOUR_FILTER_OPTIONS: { id: TourFilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "bsc", label: "BSC" },
  { id: "monthly", label: "Monthly Finals" },
  { id: "world", label: "World Finals" },
  { id: "snapdragon", label: "Snapdragon" },
  { id: "esl", label: "ESL" },
  { id: "other", label: "Otros" },
];

export function classifyTournament(slug: string, name: string): TourFilterId {
  const s = `${slug} ${name}`.toLowerCase();
  if (s.includes("world-finals") || s.includes("world finals") || s.includes("world-finals")) return "world";
  if (s.includes("monthly-finals") || s.includes("monthly finals") || s.includes("monthly")) return "monthly";
  if (s.includes("snapdragon")) return "snapdragon";
  if (s.includes("esl")) return "esl";
  if (
    s.includes("bsc") ||
    s.includes("championship") ||
    s.includes("challengers") ||
    s.includes("brawl-cup") ||
    s.includes("brawl cup")
  ) {
    return "bsc";
  }
  return "other";
}

export function filterTournamentHistory(rows: TeamTournamentRow[], filter: TourFilterId): TeamTournamentRow[] {
  if (filter === "all") return rows;
  return rows.filter((r) => classifyTournament(r.slug, r.name) === filter);
}

export type TeamAdvancedStats = {
  currentStreak: { type: "W" | "L"; count: number };
  bestWinStreak: number;
  winRateBySeason: { label: string; winRate: number; played: number }[];
  regional: { played: number; wins: number; losses: number; winRate: number };
  international: { played: number; wins: number; losses: number; winRate: number };
};

function streakFromResults(results: boolean[]): { current: { type: "W" | "L"; count: number }; bestW: number } {
  if (!results.length) return { current: { type: "W", count: 0 }, bestW: 0 };
  let bestW = 0;
  let run = 0;
  for (const won of results) {
    if (won) {
      run++;
      bestW = Math.max(bestW, run);
    } else {
      run = 0;
    }
  }
  const last = results[results.length - 1];
  let count = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === last) count++;
    else break;
  }
  return { current: { type: last ? "W" : "L", count }, bestW };
}

export function getTeamAdvancedStats(teamSlug: string, teamRegion: Region): TeamAdvancedStats {
  const finished = teamFinishedMatches(teamSlug);
  const results = finished.map((m) => matchWon(m, teamSlug));
  const { current, bestW } = streakFromResults(results);

  const byYear = new Map<string, { w: number; l: number }>();
  for (const m of finished) {
    const y = new Date(m.date).getFullYear().toString();
    const bucket = byYear.get(y) ?? { w: 0, l: 0 };
    if (matchWon(m, teamSlug)) bucket.w++;
    else bucket.l++;
    byYear.set(y, bucket);
  }
  const winRateBySeason = [...byYear.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .slice(0, 4)
    .map(([label, { w, l }]) => {
      const played = w + l;
      return { label, played, winRate: played ? Math.round((w / played) * 100) : 0 };
    });

  let regW = 0;
  let regL = 0;
  let intW = 0;
  let intL = 0;
  for (const m of finished) {
    const tour = getTournament(m.tournamentSlug);
    const isRegional = tour?.region === teamRegion || tour?.region === "GLOBAL";
    const won = matchWon(m, teamSlug);
    if (isRegional) {
      if (won) regW++;
      else regL++;
    } else {
      if (won) intW++;
      else intL++;
    }
  }
  const regPlayed = regW + regL;
  const intPlayed = intW + intL;

  return {
    currentStreak: { type: current.type, count: current.count },
    bestWinStreak: bestW,
    winRateBySeason,
    regional: {
      played: regPlayed,
      wins: regW,
      losses: regL,
      winRate: regPlayed ? Math.round((regW / regPlayed) * 100) : 0,
    },
    international: {
      played: intPlayed,
      wins: intW,
      losses: intL,
      winRate: intPlayed ? Math.round((intW / intPlayed) * 100) : 0,
    },
  };
}

export function estimateMvpCount(row: RosterPlayerStats): number {
  const formMvps = row.form.filter((f) => f === "W").length;
  if (formMvps > 0) return formMvps;
  if (row.star) return Math.max(1, Math.round(row.fantasyPoints / 30));
  return Math.max(0, Math.round(row.winRate / 25));
}
