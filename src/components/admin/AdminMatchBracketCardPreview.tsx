"use client";

import { TeamLogo } from "@/components/ui/TeamLogo";
import { MatchContextStrip } from "@/components/platform/predictions/MatchContextStrip";
import { MatchStageBadge } from "@/components/platform/predictions/MatchStageBadge";
import { MatchStatusPill } from "@/components/platform/predictions/MatchStatusPill";
import {
  adminMatchToEnrichedPrediction,
  adminMatchFormToEsportsMatch,
  type AdminMatchFormState,
} from "@/lib/data/admin-match-form";
import { formatPredictMatchTime } from "@/lib/data/predictions-ui";
import { teamName, tournamentName } from "@/lib/data";
import { getTeam } from "@/lib/data/teams";

function tagForSlug(slug: string): string {
  const team = getTeam(slug);
  return team?.tag ?? teamName(slug).slice(0, 3).toUpperCase();
}

/** Misma tarjeta visual que bracket / predicciones (solo lectura). */
export function AdminMatchBracketCardPreview({
  match,
  compactLabel = true,
}: {
  match: AdminMatchFormState & { id: string };
  compactLabel?: boolean;
}) {
  const event = adminMatchToEnrichedPrediction(match);
  const es = adminMatchFormToEsportsMatch(match.id, match);
  if (!event || !es?.teamASlug || !es?.teamBSlug) return null;

  const featured = Boolean(event.featured);
  const isLive = es.status === "live";
  const isFinished = es.status === "finished";
  const winA = isFinished && es.scoreA > es.scoreB;
  const winB = isFinished && es.scoreB > es.scoreA;
  const stageMeta = event.stageMeta!;
  const previewKey = `${match.id}-${es.teamASlug}-${es.teamBSlug}-${es.status}-${es.scoreA}-${es.scoreB}-${match.stage}`;

  const vsCenter =
    isLive || isFinished ? (
      <div className="bf-admin-match-preview-score">
        <span className={winA ? "is-win" : ""}>{es.scoreA}</span>
        <span className="bf-admin-match-preview-score-sep">:</span>
        <span className={winB ? "is-win" : ""}>{es.scoreB}</span>
        {isLive && <span className="bf-badge bf-badge-live text-[9px]">LIVE</span>}
      </div>
    ) : (
      <>
        <span className="bf-vote-vs-label">VS</span>
        <span className="bf-vote-votes">Vista previa</span>
      </>
    );

  return (
    <div className="bf-admin-match-bracket-preview bf-predict-bsc" key={previewKey}>
      {compactLabel && (
        <p className="bf-admin-tournament-preview-label">Vista previa · como en bracket y /predictions</p>
      )}
      <article
        className={[
          "bf-vote-card",
          "bf-bsc-vote-card",
          "bf-admin-match-vote-preview",
          stageMeta.cardClass,
          stageMeta.badgeClass,
          featured ? "is-featured" : "",
          event.displayStatus ? `status-${event.displayStatus}` : "",
          isLive ? "status-live" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden
      >
        <div className="bf-bsc-vote-stripe" aria-hidden />
        <div className="bf-vote-card-glow" aria-hidden />

        <MatchContextStrip event={event} />
        {stageMeta.stakesLine && <p className="bf-vote-stakes-line">{stageMeta.stakesLine}</p>}

        <div className="bf-vote-arena">
          <div
            className={`bf-vote-side bf-vote-side-a ${winA ? "is-winner" : ""}`}
            title={teamName(es.teamASlug)}
          >
            <span className="bf-vote-side-tag bf-vote-side-tag-a">{tagForSlug(es.teamASlug)}</span>
            <span className="bf-vote-side-logo">
              <TeamLogo key={`pa-${previewKey}`} slug={es.teamASlug} name={teamName(es.teamASlug)} size={featured ? 72 : 56} />
            </span>
            <span className="bf-vote-name bf-vote-name-lg">{teamName(es.teamASlug)}</span>
            <span className="bf-vote-no-pct">Sin votos</span>
          </div>

          <div className="bf-vote-vs">{vsCenter}</div>

          <div
            className={`bf-vote-side bf-vote-side-b ${winB ? "is-winner" : ""}`}
            title={teamName(es.teamBSlug)}
          >
            <span className="bf-vote-side-tag bf-vote-side-tag-b">{tagForSlug(es.teamBSlug)}</span>
            <span className="bf-vote-side-logo">
              <TeamLogo key={`pb-${previewKey}`} slug={es.teamBSlug} name={teamName(es.teamBSlug)} size={featured ? 72 : 56} />
            </span>
            <span className="bf-vote-name bf-vote-name-lg">{teamName(es.teamBSlug)}</span>
            <span className="bf-vote-no-pct">Sin votos</span>
          </div>
        </div>

        <footer className="bf-vote-foot">
          <span className="bf-vote-hint">
            {tournamentName(es.tournamentSlug)} · {es.format} ·{" "}
            {formatPredictMatchTime(es.date)}
          </span>
          <div className="bf-admin-match-preview-foot-badges">
            <MatchStageBadge meta={stageMeta} />
            {event.displayStatus && <MatchStatusPill status={event.displayStatus} compact />}
          </div>
        </footer>
      </article>
    </div>
  );
}
