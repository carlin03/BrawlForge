import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface MatchTableProps {
  matches: EsportsMatch[];
  showTournament?: boolean;
}

export function MatchTable({ matches, showTournament = true }: MatchTableProps) {
  if (!matches.length) {
    return <p style={{ padding: 16, color: "var(--x-dim)", fontSize: 12 }}>Sin partidos.</p>;
  }

  return (
    <table className="x-table">
      <thead>
        <tr>
          <th style={{ width: 56 }}>Hora</th>
          <th>Local</th>
          <th style={{ width: 64, textAlign: "center" }}>Score</th>
          <th style={{ textAlign: "right" }}>Visitante</th>
          {showTournament && <th style={{ width: 120 }}>Evento</th>}
        </tr>
      </thead>
      <tbody>
        {matches.map((m) => {
          const winA = m.status === "finished" && m.scoreA > m.scoreB;
          const winB = m.status === "finished" && m.scoreB > m.scoreA;
          const live = m.status === "live";

          return (
            <tr key={m.id} className={live ? "row-live" : ""}>
              <td className="x-td-dim">
                {live ? (
                  <span className="x-td-red" style={{ fontWeight: 800, fontSize: 10 }}>
                    LIVE
                  </span>
                ) : m.status === "upcoming" ? (
                  new Date(m.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                ) : (
                  "FT"
                )}
              </td>
              <td>
                <Link href={`/matches/${m.id}`} className="x-td-team row-link">
                  <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size={22} />
                  <span className={winA ? "x-td-gold" : ""}>{teamName(m.teamASlug)}</span>
                </Link>
              </td>
              <td className="x-td-mono" style={{ textAlign: "center" }}>
                {m.status === "upcoming" ? (
                  <span className="x-td-dim">—</span>
                ) : (
                  <>
                    <span className={winA ? "x-td-gold" : ""}>{m.scoreA}</span>
                    <span className="x-td-dim"> : </span>
                    <span className={winB ? "x-td-gold" : ""}>{m.scoreB}</span>
                  </>
                )}
              </td>
              <td style={{ textAlign: "right" }}>
                <Link href={`/matches/${m.id}`} className="x-td-team end row-link">
                  <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size={22} />
                  <span className={winB ? "x-td-gold" : ""}>{teamName(m.teamBSlug)}</span>
                </Link>
              </td>
              {showTournament && (
                <td className="x-td-dim">{tournamentName(m.tournamentSlug)}</td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
