"use client";

import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { getH2HStats, getTeamMatchStats } from "@/lib/data/match-team-stats";
import { teamName, tournamentName, getTeam } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { FormDots } from "@/components/platform/ui";

export function MatchStatsVisual({ match }: { match: EsportsMatch }) {
  const statsA = getTeamMatchStats(match.teamASlug);
  const statsB = getTeamMatchStats(match.teamBSlug);
  const h2h = getH2HStats(match.teamASlug, match.teamBSlug, match.id);
  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);

  return (
    <section className="bf-match-esports-panel">
      <h2 className="bf-match-esports-h2">Estadísticas</h2>

      <div className="bf-stats-h2h-hero">
        <div className="bf-stats-h2h-team">
          <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={52} />
          <span>{teamName(match.teamASlug)}</span>
        </div>
        <div className="bf-stats-h2h-score">
          <strong>
            {h2h.winsA} – {h2h.winsB}
          </strong>
          <span>H2H · {h2h.total} partidos</span>
        </div>
        <div className="bf-stats-h2h-team">
          <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={52} />
          <span>{teamName(match.teamBSlug)}</span>
        </div>
      </div>

      <div className="bf-stats-compare-bars">
        {[
          { label: "Win rate", a: statsA.winRate, b: statsB.winRate, suffix: "%" },
          { label: "Victorias", a: statsA.wins, b: statsB.wins },
          { label: "Derrotas", a: statsA.losses, b: statsB.losses },
        ].map((row) => {
          const max = Math.max(row.a, row.b, 1);
          return (
            <div key={row.label} className="bf-stats-bar-row">
              <span className="bf-stats-bar-label">{row.label}</span>
              <div className="bf-stats-bar-duel">
                <div className="bf-stats-bar-a" style={{ width: `${(row.a / max) * 100}%` }}>
                  {row.a}
                  {row.suffix ?? ""}
                </div>
                <div className="bf-stats-bar-b" style={{ width: `${(row.b / max) * 100}%` }}>
                  {row.b}
                  {row.suffix ?? ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bf-stats-form-row">
        <div>
          <span>Forma · {teamName(match.teamASlug)}</span>
          {teamA && <FormDots form={teamA.form} />}
        </div>
        <div>
          <span>Forma · {teamName(match.teamBSlug)}</span>
          {teamB && <FormDots form={teamB.form} />}
        </div>
      </div>

      <div className="bf-stats-recent">
        <h3>Últimos resultados</h3>
        <div className="bf-stats-recent-cols">
          {[statsA.recent.slice(0, 5), statsB.recent.slice(0, 5)].map((list, side) => (
            <ul key={side}>
              {list.map((m) => {
                const our = side === 0 ? match.teamASlug : match.teamBSlug;
                const vs = m.teamASlug === our ? m.teamBSlug : m.teamASlug;
                const win =
                  m.status === "finished" &&
                  (m.teamASlug === our ? m.scoreA > m.scoreB : m.scoreB > m.scoreA);
                return (
                  <li key={m.id}>
                    <Link href={`/matches/${m.id}`} className={`bf-stats-recent-card ${win ? "is-win" : "is-loss"}`}>
                      <TeamLogo slug={vs} name={teamName(vs)} size={28} />
                      <div>
                        <strong>vs {teamName(vs)}</strong>
                        <span>
                          <TournamentLogo slug={m.tournamentSlug} name={tournamentName(m.tournamentSlug)} size={14} />
                          {m.scoreA}-{m.scoreB}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
