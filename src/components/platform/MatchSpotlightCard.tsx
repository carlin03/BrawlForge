"use client";

import Link from "next/link";
import { ChevronRight, Radio } from "lucide-react";
import type { EsportsMatch } from "@/lib/data/matches";
import { getTeam, teamName, tournamentName } from "@/lib/data";
import { getMatchEnrichment } from "@/lib/data/match-meta";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { MatchCountdown } from "@/components/platform/MatchCountdown";
import { FormDots } from "@/components/platform/ui";
import { RegionBadge } from "@/components/ui/RegionBadge";

export function MatchSpotlightCard({ match }: { match: EsportsMatch }) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const upcoming = match.status === "upcoming";
  const winA = finished && match.scoreA > match.scoreB;
  const winB = finished && match.scoreB > match.scoreA;
  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const enrich = getMatchEnrichment(match);

  return (
    <Link href={`/matches/${match.id}`} className={`bf-match-spotlight ${live ? "is-live" : ""}`}>
      <div className="bf-match-spotlight-bg" aria-hidden />
      <header className="bf-match-spotlight-head">
        <div className="bf-match-spotlight-tour">
          <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={40} glow={false} />
          <div>
            <strong>{tournamentName(match.tournamentSlug)}</strong>
            <span>
              {match.stage} · {match.format}
            </span>
          </div>
        </div>
        <div className="bf-match-spotlight-badges">
          <RegionBadge region={match.region} />
          {live && (
            <span className="bp-chip bp-chip-live">
              <Radio size={12} /> LIVE
            </span>
          )}
          {upcoming && !live && <MatchCountdown dateStr={match.date} className="bf-match-spotlight-countdown" />}
          {finished && <span className="bp-chip">Finalizado</span>}
        </div>
      </header>

      <div className="bf-match-spotlight-duel">
        <div className={`bf-match-spotlight-side ${winA ? "is-winner" : ""}`}>
          <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={72} glow />
          <span className="bf-match-spotlight-name">{teamName(match.teamASlug, match)}</span>
          {teamA?.form && <FormDots form={teamA.form} />}
          {finished && <span className="bf-match-spotlight-score">{match.scoreA}</span>}
        </div>

        <div className="bf-match-spotlight-mid">
          {!finished ? (
            <>
              <span className="bf-match-spotlight-vs">VS</span>
              {upcoming && (
                <time dateTime={match.date} className="bf-match-spotlight-date">
                  {new Date(match.date).toLocaleString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              )}
            </>
          ) : (
            <span className="bf-match-spotlight-ft">FT</span>
          )}
        </div>

        <div className={`bf-match-spotlight-side ${winB ? "is-winner" : ""}`}>
          <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={72} glow />
          <span className="bf-match-spotlight-name">{teamName(match.teamBSlug, match)}</span>
          {teamB?.form && <FormDots form={teamB.form} />}
          {finished && <span className="bf-match-spotlight-score">{match.scoreB}</span>}
        </div>
      </div>

      <footer className="bf-match-spotlight-foot">
        <span>{enrich.quickStat}</span>
        <span className="bf-match-spotlight-cta">
          Ver partido <ChevronRight size={16} />
        </span>
      </footer>
    </Link>
  );
}
