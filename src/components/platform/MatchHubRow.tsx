"use client";

import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { getTeam, resolveMatchTeamName } from "@/lib/data";
import { getMatchEnrichment, isPendingTeamSlug } from "@/lib/data/match-meta";
import { bracketSlotDisplayLabel } from "@/lib/data/bracket-slot-display";
import { getEffectiveMatchStatus } from "@/lib/data/match-effective-status";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { MatchCountdown } from "@/components/platform/MatchCountdown";
import { FormDots } from "@/components/platform/ui";
import { MatchSourceBadge } from "@/components/platform/MatchSourceBadge";

function displayTeamName(match: EsportsMatch, side: "A" | "B"): string {
  const slug = side === "A" ? match.teamASlug : match.teamBSlug;
  if (isPendingTeamSlug(slug)) return bracketSlotDisplayLabel(slug);
  return resolveMatchTeamName(match, side);
}

export function MatchHubRow({ match }: { match: EsportsMatch }) {
  const status = getEffectiveMatchStatus(match);
  const live = status === "live";
  const finished = status === "finished";
  const upcoming = status === "upcoming";
  const winA = finished && match.scoreA > match.scoreB;
  const winB = finished && match.scoreB > match.scoreA;
  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const enrich = getMatchEnrichment(match);
  const date = new Date(match.date);
  const scheduleLabel = date.toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeLabel = live ? (
    <span className="bf-match-row-live">
      <span className="bp-live-dot" /> LIVE
    </span>
  ) : finished ? (
    <>
      <strong>FT</strong>
      <span>{date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
    </>
  ) : (
    <>
      <strong>
        <MatchCountdown dateStr={match.date} />
      </strong>
      <span>{scheduleLabel}</span>
    </>
  );

  return (
    <Link href={`/matches/${match.id}`} className={`bf-match-row ${live ? "is-live" : ""}`}>
      <div className="bf-match-row-time">{timeLabel}</div>

      <div className="bf-match-row-team">
        <TeamLogo slug={match.teamASlug} name={displayTeamName(match, "A")} size={36} glow={false} />
        <div className="bf-match-row-team-text">
          <span className={`bf-match-row-name ${winA ? "is-win" : ""}`}>{displayTeamName(match, "A")}</span>
          {teamA?.form && <FormDots form={teamA.form} />}
        </div>
      </div>

      <div className="bf-match-row-score">
        {upcoming ? (
          <>
            <span className="bf-match-row-dash">—</span>
            <span className="bf-match-row-vs">vs</span>
            <span className="bf-match-row-dash">—</span>
          </>
        ) : (
          <>
            <span className={winA ? "is-win" : ""}>{match.scoreA}</span>
            <span className="bf-match-row-sep">–</span>
            <span className={winB ? "is-win" : ""}>{match.scoreB}</span>
          </>
        )}
      </div>

      <div className="bf-match-row-team is-away">
        <TeamLogo slug={match.teamBSlug} name={displayTeamName(match, "B")} size={36} glow={false} />
        <div className="bf-match-row-team-text">
          <span className={`bf-match-row-name ${winB ? "is-win" : ""}`}>{displayTeamName(match, "B")}</span>
          {teamB?.form && <FormDots form={teamB.form} />}
        </div>
      </div>

      <div className="bf-match-row-meta">
        <MatchSourceBadge match={match} />
        <span className="bf-match-row-stage">{match.stage}</span>
        <span className="bf-match-row-stat">{enrich.quickStat}</span>
      </div>
    </Link>
  );
}
