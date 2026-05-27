import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getMatchesByTournament, teamName } from "@/lib/data";
import { groupMatchesByRound } from "@/lib/data/tournament-stats";
import type { EsportsMatch } from "@/lib/data/matches";

function MatchClashCard({ match }: { match: EsportsMatch }) {
  const winnerA = match.status === "finished" && match.scoreA > match.scoreB;
  const winnerB = match.status === "finished" && match.scoreB > match.scoreA;
  const live = match.status === "live";
  const upcoming = match.status === "upcoming";

  return (
    <Link href={`/matches/${match.id}`} className={`tn-clash ${live ? "tn-clash-live" : ""}`}>
      <div className="tn-clash-meta">
        {live ? (
          <span className="tn-clash-live-badge">
            <span className="bf-pulse" />
            LIVE
          </span>
        ) : upcoming ? (
          <span className="tn-clash-time">
            {new Date(match.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            {" · "}
            {new Date(match.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : (
          <span className="tn-clash-time">Final</span>
        )}
        <span className="tn-clash-format">{match.format}</span>
      </div>

      <div className="tn-clash-teams">
        <div className={`tn-clash-side ${winnerA ? "tn-clash-winner" : ""}`}>
          <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={56} />
          <span className="tn-clash-name">{teamName(match.teamASlug)}</span>
        </div>

        <div className="tn-clash-center">
          {upcoming ? (
            <span className="tn-clash-vs">VS</span>
          ) : (
            <div className="tn-clash-score">
              <span className={winnerA ? "tn-clash-score-win" : ""}>{match.scoreA}</span>
              <span className="tn-clash-score-sep">:</span>
              <span className={winnerB ? "tn-clash-score-win" : ""}>{match.scoreB}</span>
            </div>
          )}
        </div>

        <div className={`tn-clash-side tn-clash-side-b ${winnerB ? "tn-clash-winner" : ""}`}>
          <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={56} />
          <span className="tn-clash-name">{teamName(match.teamBSlug)}</span>
        </div>
      </div>
    </Link>
  );
}

interface TournamentMatchCenterProps {
  slug: string;
}

export function TournamentMatchCenter({ slug }: TournamentMatchCenterProps) {
  const matches = getMatchesByTournament(slug);
  const matchdays = groupMatchesByRound(matches);

  if (matchdays.length === 0) {
    return (
      <section className="tn-match-center">
        <div className="tn-match-empty">Calendario próximamente.</div>
      </section>
    );
  }

  return (
    <section className="tn-match-center">
      <div className="tn-match-center-head">
        <div>
          <h2 className="tn-match-center-title">Partidos & Jornadas</h2>
          <p className="tn-match-center-sub">
            {matches.length} enfrentamientos · {matchdays.length} jornadas
          </p>
        </div>
        <Link href="/predictions" className="bf-btn bf-btn-red text-sm">
          Vota en estos partidos
        </Link>
      </div>

      {matchdays.map((day) => (
        <div key={day.id} className="tn-matchday">
          <div className="tn-matchday-head">
            <div>
              <div className="tn-matchday-label">{day.label}</div>
              {day.sublabel && <div className="tn-matchday-date">{day.sublabel}</div>}
            </div>
            <span className="tn-matchday-count">{day.matches.length} partidos</span>
          </div>
          <div className="tn-clash-grid">
            {day.matches.map((m) => (
              <MatchClashCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
