"use client";

import { BracketPendingDuel } from "@/components/platform/predictions/BracketPendingDuel";
import { BracketMatchCard } from "@/components/platform/predictions/BracketMatchCard";
import type { PlayoffBracketConfig, BracketLayoutMode } from "@/lib/data/bracket-config";
import { enrichPrediction } from "@/lib/data/predictions-ui";
import type { PredictionEvent } from "@/lib/data/predictions";
import { tournamentName } from "@/lib/data";

function slotToEvent(
  config: PlayoffBracketConfig,
  teamA: string,
  teamB: string,
  stage: string,
  idx: number,
): PredictionEvent {
  const id = `preview-${config.tournament_slug}-${stage}-${idx}-${teamA}-${teamB}`;
  return {
    id,
    matchId: id,
    teamASlug: teamA || "tbd",
    teamBSlug: teamB || "tbd",
    pickAPct: 50,
    pickBPct: 50,
    totalVotes: 0,
    rewardPoints: 55,
    deadline: new Date().toISOString(),
    stage,
    tournamentSlug: config.tournament_slug,
    status: "open",
    userPick: null,
  };
}

function PreviewDuel({
  config,
  teamA,
  teamB,
  stage,
  idx,
  featured,
  layout,
}: {
  config: PlayoffBracketConfig;
  teamA: string;
  teamB: string;
  stage: string;
  idx: number;
  featured?: boolean;
  layout: BracketLayoutMode;
}) {
  if (!teamA && !teamB) {
    return <BracketPendingDuel title="Pendiente de clasificación" subtitle="Asigna equipos en el editor." />;
  }
  const event = enrichPrediction(slotToEvent(config, teamA, teamB, stage, idx), {});
  return (
    <div className={layout === "1" ? "bf-bracket-solo-slot" : ""}>
      <BracketMatchCard event={event} votes={{}} featured={featured} />
    </div>
  );
}

export function BracketLivePreview({ config }: { config: PlayoffBracketConfig }) {
  const layout = config.layout;
  const colsClass =
    layout === "2" ? "bf-predict-bracket-qf-grid" : layout === "1" ? "bf-predict-bracket-stack" : "bf-predict-bracket-qf-grid";

  return (
    <div className="bf-bracket-live-preview bf-predict-bsc">
      {config.rounds.quarters && (
        <section className={`bf-predict-bracket-round ${config.slots.quarters.length === 1 ? "is-solo-round" : ""}`}>
          <h3 className="bf-predict-bracket-round-title">Cuartos</h3>
          <div className={colsClass}>
            {config.slots.quarters.map((slot, i) => (
              <PreviewDuel
                key={i}
                config={config}
                teamA={slot.team_a_slug}
                teamB={slot.team_b_slug}
                stage="Quarterfinal"
                idx={i}
                layout={layout}
              />
            ))}
          </div>
        </section>
      )}
      {config.rounds.semis && (
        <section className={`bf-predict-bracket-round ${config.slots.semis.length === 1 ? "is-solo-round" : ""}`}>
          <h3 className="bf-predict-bracket-round-title">Semifinales</h3>
          <div className="bf-predict-bracket-sf-grid">
            {config.slots.semis.map((slot, i) => (
              <PreviewDuel
                key={i}
                config={config}
                teamA={slot.team_a_slug}
                teamB={slot.team_b_slug}
                stage="Semifinal"
                idx={i}
                layout={layout}
              />
            ))}
          </div>
        </section>
      )}
      {config.rounds.final && config.slots.final && (
        <section className="bf-predict-bracket-round is-solo-round">
          <h3 className="bf-predict-bracket-round-title">Gran final</h3>
          <div className="bf-predict-bracket-grand-final">
            <PreviewDuel
              config={config}
              teamA={config.slots.final.team_a_slug}
              teamB={config.slots.final.team_b_slug}
              stage="Grand Final"
              idx={0}
              featured
              layout={layout}
            />
          </div>
        </section>
      )}
      <p className="bf-studio-muted" style={{ marginTop: 12 }}>
        Vista previa · {tournamentName(config.tournament_slug)} · layout {layout}
      </p>
    </div>
  );
}
