import {
  getMatchesByTournament,
  getTournament,
  getTournamentParticipantSlugs,
  type EsportsMatch,
} from "./matches";
import { getFantasyTeamsForTournament } from "./fantasy-rosters";

export interface TournamentStandingRow {
  rank: number;
  teamSlug: string;
  w: number;
  l: number;
  diff: string;
}

export interface TournamentStats {
  slug: string;
  participantCount: number;
  participantSlugs: string[];
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  finishedMatches: number;
  formats: string[];
  standings: TournamentStandingRow[];
  prizeBreakdown: { place: string; prize: string }[];
}

function computeStandings(matches: EsportsMatch[]): TournamentStandingRow[] {
  const rec = new Map<string, { w: number; l: number; for: number; against: number }>();

  const touch = (slug: string) => {
    if (!rec.has(slug)) rec.set(slug, { w: 0, l: 0, for: 0, against: 0 });
    return rec.get(slug)!;
  };

  for (const m of matches) {
    if (m.status !== "finished") continue;
    if (!m.teamASlug || !m.teamBSlug || m.teamASlug === "tbd" || m.teamBSlug === "tbd") continue;

    const a = touch(m.teamASlug);
    const b = touch(m.teamBSlug);
    a.for += m.scoreA;
    a.against += m.scoreB;
    b.for += m.scoreB;
    b.against += m.scoreA;

    if (m.scoreA > m.scoreB) {
      a.w++;
      b.l++;
    } else if (m.scoreB > m.scoreA) {
      b.w++;
      a.l++;
    }
  }

  return [...rec.entries()]
    .map(([teamSlug, r]) => ({
      teamSlug,
      w: r.w,
      l: r.l,
      diff: r.for - r.against >= 0 ? `+${r.for - r.against}` : String(r.for - r.against),
      pts: r.w * 3,
    }))
    .sort((a, b) => b.pts - a.pts || b.w - a.w || parseInt(b.diff, 10) - parseInt(a.diff, 10))
    .map((row, i) => ({
      rank: i + 1,
      teamSlug: row.teamSlug,
      w: row.w,
      l: row.l,
      diff: row.diff,
    }));
}

function parsePrizeBreakdown(prizePool: string): { place: string; prize: string }[] {
  const num = parseInt(prizePool.replace(/\D/g, ""), 10);
  if (!num) return [{ place: "1º", prize: prizePool || "TBD" }];
  return [
    { place: "1º", prize: prizePool },
    { place: "2º", prize: `$${Math.round(num * 0.4).toLocaleString("en-US")}` },
    { place: "3º–4º", prize: `$${Math.round(num * 0.15).toLocaleString("en-US")}` },
  ];
}

export function resolveTournamentParticipants(slug: string): string[] {
  const fromApi = getTournamentParticipantSlugs(slug);
  if (fromApi.length >= 2) return fromApi;

  const fromFantasy = getFantasyTeamsForTournament(slug);
  if (fromFantasy.length >= 2) return fromFantasy;

  const fromMatches = [
    ...new Set(
      getMatchesByTournament(slug)
        .flatMap((m) => [m.teamASlug, m.teamBSlug])
        .filter((s) => s && s !== "tbd"),
    ),
  ];
  return fromMatches;
}

export function getTournamentStats(slug: string): TournamentStats {
  const t = getTournament(slug);
  const matches = getMatchesByTournament(slug);
  const participantSlugs = resolveTournamentParticipants(slug);
  const formats = [...new Set(matches.map((m) => m.format).filter(Boolean))];
  const finished = matches.filter((m) => m.status === "finished");

  return {
    slug,
    participantCount: participantSlugs.length || t?.teams || 0,
    participantSlugs,
    totalMatches: matches.length,
    liveMatches: matches.filter((m) => m.status === "live").length,
    upcomingMatches: matches.filter((m) => m.status === "upcoming").length,
    finishedMatches: finished.length,
    formats,
    standings: computeStandings(matches),
    prizeBreakdown: t?.prizePool ? parsePrizeBreakdown(t.prizePool) : [{ place: "1º", prize: "TBD" }],
  };
}

export function formatTournamentDates(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    if (start === end) return s.toLocaleDateString("es-ES", opts);
    return `${s.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("es-ES", opts)}`;
  } catch {
    return `${start} — ${end}`;
  }
}

export interface TournamentMatchday {
  id: string;
  label: string;
  sublabel?: string;
  matches: EsportsMatch[];
}

const STATUS_ORDER: Record<EsportsMatch["status"], number> = {
  live: 0,
  upcoming: 1,
  finished: 2,
};

export function groupMatchesByRound(matches: EsportsMatch[]): TournamentMatchday[] {
  const groups = new Map<string, EsportsMatch[]>();

  for (const m of matches) {
    const stage = m.stage?.trim() || "Calendario";
    const day = m.date?.slice(0, 10) ?? "";
    const key = `${stage}::${day}`;
    const list = groups.get(key) ?? [];
    list.push(m);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([key, list]) => {
      const [stage, day] = key.split("::");
      const sorted = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.date.localeCompare(b.date));
      let sublabel = "";
      if (day) {
        try {
          sublabel = new Date(day).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
        } catch {
          sublabel = day;
        }
      }
      return {
        id: key,
        label: stage,
        sublabel,
        matches: sorted,
      };
    })
    .sort((a, b) => {
      const liveA = a.matches.some((m) => m.status === "live");
      const liveB = b.matches.some((m) => m.status === "live");
      if (liveA !== liveB) return liveA ? -1 : 1;
      const dateA = a.matches[0]?.date ?? "";
      const dateB = b.matches[0]?.date ?? "";
      return dateA.localeCompare(dateB);
    });
}
