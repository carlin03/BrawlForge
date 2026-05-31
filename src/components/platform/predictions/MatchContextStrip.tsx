import { TournamentLogo } from "@/components/ui/TournamentLogo";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { formatPredictMatchTime } from "@/lib/data/predictions-ui";
import { MatchStageBadge } from "@/components/platform/predictions/MatchStageBadge";
import { MatchStatusPill } from "@/components/platform/predictions/MatchStatusPill";
import { PredictExtraButton } from "@/components/platform/predictions/PredictExtraButton";

export function MatchContextStrip({
  event,
  hasVote,
}: {
  event: EnrichedPrediction;
  hasVote?: boolean;
}) {
  const tour = event.tournamentShortName ?? event.tournamentSlug;
  const region = event.region;

  return (
    <div className="bf-predict-context-strip">
      <div className="bf-predict-context-primary">
        <TournamentLogo slug={event.tournamentSlug} name={tour} size={20} glow={false} />
        <div className="bf-predict-context-text">
          <span className="bf-predict-context-tourney">{tour}</span>
          <span className="bf-predict-context-stage">
            {event.stageMeta?.fullLabel ?? event.stage}
            {region ? ` · ${region}` : ""}
          </span>
        </div>
        <span className="bf-predict-context-pts">+{event.rewardPoints}</span>
      </div>
      <div className="bf-predict-context-secondary">
        {event.stageMeta && <MatchStageBadge meta={event.stageMeta} />}
        {event.displayStatus && <MatchStatusPill status={event.displayStatus} compact />}
        <time className="bf-predict-context-time" dateTime={event.matchDate ?? event.deadline}>
          {formatPredictMatchTime(event.matchDate ?? event.deadline)}
        </time>
        {event.status !== "closed" && (
          <PredictExtraButton matchId={event.matchId} hasVote={hasVote} compact />
        )}
      </div>
    </div>
  );
}
