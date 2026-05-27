import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface MatchLineProps {
  match: EsportsMatch;
}

export function MatchLine({ match }: MatchLineProps) {
  const winA = match.status === "finished" && match.scoreA > match.scoreB;
  const winB = match.status === "finished" && match.scoreB > match.scoreA;
  const isLive = match.status === "live";

  const timeLabel =
    match.status === "live"
      ? "LIVE"
      : match.status === "upcoming"
        ? new Date(match.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
        : "FT";

  return (
    <Link href={`/matches/${match.id}`} className={`es-match ${isLive ? "is-live" : ""}`}>
      <div className={`es-match-time ${isLive ? "is-live" : ""}`}>
        {isLive && <span className="es-live-dot inline-block mr-1" />}
        {timeLabel}
      </div>

      <div className="es-match-team">
        <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={24} />
        <span className={`es-match-team-name ${winA ? "is-win" : ""}`}>{teamName(match.teamASlug)}</span>
      </div>

      <div className="es-match-score">
        {match.status === "upcoming" ? (
          <span style={{ color: "var(--es-dim)", fontSize: "0.85rem" }}>vs</span>
        ) : (
          <>
            <span style={{ color: winA ? "var(--es-gold)" : "var(--es-dim)" }}>{match.scoreA}</span>
            <span style={{ color: "var(--es-dim)", margin: "0 2px" }}>:</span>
            <span style={{ color: winB ? "var(--es-gold)" : "var(--es-dim)" }}>{match.scoreB}</span>
          </>
        )}
      </div>

      <div className="es-match-team end">
        <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={24} />
        <span className={`es-match-team-name ${winB ? "is-win" : ""}`}>{teamName(match.teamBSlug)}</span>
      </div>

      <div className="es-match-meta">{tournamentName(match.tournamentSlug)}</div>
    </Link>
  );
}
