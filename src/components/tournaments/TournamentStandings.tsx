import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTournamentStats } from "@/lib/data/tournament-stats";
import { teamName } from "@/lib/data";

interface TournamentStandingsProps {
  slug: string;
  limit?: number;
}

export function TournamentStandings({ slug, limit }: TournamentStandingsProps) {
  const { standings, finishedMatches } = getTournamentStats(slug);
  const rows = limit ? standings.slice(0, limit) : standings;

  if (rows.length === 0) return null;

  return (
    <section className="tn-standings">
      <div className="tn-standings-head">
        <h2 className="tn-standings-title">Clasificación</h2>
        <span className="tn-standings-meta">{finishedMatches} partidos jugados</span>
      </div>
      <div className="tn-standings-table">
        <div className="tn-standings-row tn-standings-header">
          <span>#</span>
          <span>Equipo</span>
          <span>W</span>
          <span>L</span>
          <span>Diff</span>
        </div>
        {rows.map((row) => (
          <div key={row.teamSlug} className="tn-standings-row">
            <span className="tn-standings-rank">{row.rank}</span>
            <Link href={`/teams/${row.teamSlug}`} className="tn-standings-team">
              <TeamLogo slug={row.teamSlug} name={teamName(row.teamSlug)} size={32} />
              <span>{teamName(row.teamSlug)}</span>
            </Link>
            <span className="tn-standings-w">{row.w}</span>
            <span className="tn-standings-l">{row.l}</span>
            <span className="tn-standings-diff">{row.diff}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
