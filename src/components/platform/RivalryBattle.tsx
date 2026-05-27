import Link from "next/link";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament, hasCommunityVotes } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

export function RivalryBattle({ event, compact }: { event: PredictionEvent; compact?: boolean }) {
  const hasVotes = hasCommunityVotes(event);
  const leader = event.pickAPct >= event.pickBPct ? "A" : "B";
  const confidence = Math.max(event.pickAPct, event.pickBPct);
  const isClose = hasVotes && confidence < 55;
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");

  return (
    <Link href="/predictions" className={`bf-rivalry ${compact ? "bf-rivalry-compact" : ""} ${isClose ? "is-tight" : ""}`}>
      <div className="bf-rivalry-head">
        <span className="bf-rivalry-kicker">
          {hasVotes ? (isClose ? "Voto dividido" : "Community battle") : "Predicción abierta"}
        </span>
        <span className="bf-rivalry-reward">+{event.rewardPoints} pts</span>
      </div>
      <div className="bf-rivalry-tourney">{getPredictionTournament(event)} · {event.stage}</div>
      <div className="bf-rivalry-arena">
        <div className={`bf-rivalry-fighter ${hasVotes && leader === "A" ? "leading" : ""}`}>
          <TeamLogo slug={event.teamASlug} name={labelA} size={compact ? 44 : 56} />
          <span className="bf-rivalry-name">{labelA}</span>
          {hasVotes && <span className="bf-rivalry-pct">{event.pickAPct}%</span>}
        </div>
        <div className="bf-rivalry-vs">
          <span>VS</span>
          {hasVotes && (
            <span className="bf-rivalry-votes">{(event.totalVotes / 1000).toFixed(1)}K votos</span>
          )}
        </div>
        <div className={`bf-rivalry-fighter ${hasVotes && leader === "B" ? "leading" : ""}`}>
          <TeamLogo slug={event.teamBSlug} name={labelB} size={compact ? 44 : 56} />
          <span className="bf-rivalry-name">{labelB}</span>
          {hasVotes && <span className="bf-rivalry-pct">{event.pickBPct}%</span>}
        </div>
      </div>
      {hasVotes && (
        <div className="bf-rivalry-bar">
          <div className="bf-rivalry-bar-a" style={{ width: `${event.pickAPct}%` }} />
          <div className="bf-rivalry-bar-b" style={{ width: `${event.pickBPct}%` }} />
        </div>
      )}
      <div className="bf-rivalry-foot">
        {hasVotes
          ? isClose
            ? "Voto dividido — tu pick puede cambiar todo"
            : `${confidence}% favorece a ${getPredictionLabel(event, leader)}`
          : SHOW_DEMO_SOCIAL
            ? "Sin votos aún"
            : "Vota quién gana — resultados reales del circuito"}
      </div>
    </Link>
  );
}
