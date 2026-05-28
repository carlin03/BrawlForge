"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents, hasRealVotes } from "@/lib/data/predictions-build";
import { getPredictionLabel } from "@/lib/data";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";

export function MatchVotePanel({ matchId }: { matchId: string }) {
  const { ready, aggregates, game } = useGame();
  const event = useMemo(() => {
    const { open, closed } = buildPredictionEvents(aggregates, game?.votes ?? {});
    return [...open, ...closed].find((e) => e.matchId === matchId);
  }, [aggregates, game?.votes, matchId]);

  if (!ready) {
    return <p className="bf-home-empty">Cargando comunidad…</p>;
  }

  if (!event) {
    return (
      <div className="bf-premium-empty-vote">
        <p>No hay votación abierta para este partido.</p>
        <Link href="/predictions" className="bp-btn bp-btn-red">
          Ver predicciones activas
        </Link>
      </div>
    );
  }

  if (event.status === "open") {
    return <InteractiveVoteCard event={event} featured />;
  }

  const hasVotes = hasRealVotes(event);
  return (
    <div className="bf-premium-closed-vote">
      <p className="bf-premium-closed-label">Resultado · votación cerrada</p>
      {hasVotes ? (
        <>
          <div className="bf-premium-closed-bars">
            <span>{getPredictionLabel(event, "A")}</span>
            <div className="bp-poll-bar">
              <div className="bp-poll-bar-a" style={{ width: `${event.pickAPct}%` }} />
              <div className="bp-poll-bar-b" style={{ width: `${event.pickBPct}%` }} />
            </div>
            <span>{getPredictionLabel(event, "B")}</span>
          </div>
          <p className="bf-premium-closed-meta">
            {event.pickAPct}% — {event.pickBPct}% · {event.totalVotes} votos reales
          </p>
        </>
      ) : (
        <p className="bf-premium-closed-meta">Sin votos registrados en este partido.</p>
      )}
      {event.correctPick && (
        <p className="bf-premium-closed-winner">
          Ganador: <strong>{getPredictionLabel(event, event.correctPick)}</strong>
        </p>
      )}
    </div>
  );
}
