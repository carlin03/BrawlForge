"use client";

import Link from "next/link";
import { Flame, Target, Trophy, Clock, Radio } from "lucide-react";
import type { EsportsMatch } from "@/lib/data/matches";
import { parseMatchMeta, displayStatusLabel, featuredLabelFromMeta } from "@/lib/data/match-meta";
import { tournamentName } from "@/lib/data";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { MatchRoundVisual } from "@/components/match-esports/MatchRoundVisual";

export function MatchCompetitiveContext({ match }: { match: EsportsMatch }) {
  const meta = parseMatchMeta(match.meta);
  const dt = new Date(match.date);
  const status = displayStatusLabel(meta.display_status, match.status);
  const dtDate = dt.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bf-match-context-strip">
      <Link href={`/tournaments/${match.tournamentSlug}`} className="bf-match-ctx-badge is-tournament">
        <Trophy size={14} aria-hidden />
        <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={20} />
        {tournamentName(match.tournamentSlug)}
      </Link>
      {meta.importance && meta.importance !== "normal" && (
        <span className="bf-match-ctx-badge is-importance">
          <Flame size={14} aria-hidden />
          {featuredLabelFromMeta(meta)}
        </span>
      )}
      <MatchRoundVisual stage={match.stage || meta.round_type || "Group Stage"} size="sm" />
      <span className="bf-match-ctx-badge is-date">
        <Clock size={14} aria-hidden />
        {dtDate}
      </span>
      <span className="bf-match-ctx-badge is-format">
        <Target size={14} aria-hidden />
        {match.format}
      </span>
      <span className="bf-match-ctx-badge is-time">
        <Clock size={14} aria-hidden />
        {dt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="bf-match-ctx-badge is-region">{match.region}</span>
      {match.status === "live" && (
        <span className="bf-match-ctx-badge is-live">
          <Radio size={14} aria-hidden />
          En vivo
        </span>
      )}
      {match.status !== "live" && (
        <span className={`bf-match-ctx-badge is-status is-${meta.display_status ?? match.status}`}>{status}</span>
      )}
    </div>
  );
}
