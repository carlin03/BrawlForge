"use client";

import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { teamName, matches } from "@/lib/data";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { enrichPrediction } from "@/lib/data/predictions-ui";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getMatchStageMeta } from "@/lib/data/match-stage-meta";
import { useGame } from "@/contexts/GameContext";

function toOpenPrediction(m: EsportsMatch, votes: Record<string, "A" | "B">): PredictionEvent {
  const meta = getMatchStageMeta(m.stage);
  return {
    id: `match-detail-${m.id}`,
    matchId: m.id,
    teamASlug: m.teamASlug,
    teamBSlug: m.teamBSlug,
    pickAPct: 50,
    pickBPct: 50,
    totalVotes: 0,
    rewardPoints: 55,
    deadline: m.date,
    stage: m.stage,
    tournamentSlug: m.tournamentSlug,
    status: m.status === "finished" ? "closed" : "open",
    userPick: votes[m.id] ?? null,
    importance: parseMatchMeta(m.meta).importance,
    featured: meta.tier >= 4,
  };
}

export function MatchDetailExtras({ match }: { match: EsportsMatch }) {
  const { game } = useGame();
  const votes = game?.votes ?? {};
  const meta = parseMatchMeta(match.meta);

  const h2h = matches
    .filter(
      (m) =>
        m.id !== match.id &&
        m.status === "finished" &&
        ((m.teamASlug === match.teamASlug && m.teamBSlug === match.teamBSlug) ||
          (m.teamASlug === match.teamBSlug && m.teamBSlug === match.teamASlug)),
    )
    .slice(0, 5);

  const recentA = matches
    .filter((m) => m.id !== match.id && (m.teamASlug === match.teamASlug || m.teamBSlug === match.teamASlug))
    .slice(0, 4);
  const recentB = matches
    .filter((m) => m.id !== match.id && (m.teamASlug === match.teamBSlug || m.teamBSlug === match.teamBSlug))
    .slice(0, 4);

  const predEvent = enrichPrediction(toOpenPrediction(match, votes), votes);

  return (
    <div className="bf-match-detail-extras">
      {match.status !== "finished" && (
        <section className="bf-match-detail-predict">
          <h2 className="bf-match-detail-h2">Predicción</h2>
          <Link href="/predictions" className="bf-match-detail-link">
            Ver todos los pick&apos;ems
          </Link>
          <div className="bf-predict-bracket-grand-final">
            <InteractiveVoteCard event={predEvent} featured />
          </div>
          {meta.allow_exact_score && (
            <p className="bf-match-detail-note">
              Resultado exacto disponible en la card cuando el formato lo permita (BO3/BO5).
            </p>
          )}
        </section>
      )}

      {meta.maps?.possible && meta.maps.possible.length > 0 && (
        <section className="bf-match-detail-panel">
          <h2 className="bf-match-detail-h2">Mapas</h2>
          <ul className="bf-match-detail-chips">
            {meta.maps.possible.map((map) => (
              <li key={map}>{map}</li>
            ))}
          </ul>
          {meta.maps.current && (
            <p className="bf-match-detail-note">Mapa actual: {meta.maps.current}</p>
          )}
        </section>
      )}

      {(meta.bans?.maps_a?.length || meta.bans?.maps_b?.length) && (
        <section className="bf-match-detail-panel">
          <h2 className="bf-match-detail-h2">Bans de mapas</h2>
          <div className="bf-match-detail-bans">
            <div>
              <span className="bf-match-detail-ban-label">{teamName(match.teamASlug)}</span>
              <p>{meta.bans?.maps_a?.join(", ") || "—"}</p>
            </div>
            <div>
              <span className="bf-match-detail-ban-label">{teamName(match.teamBSlug)}</span>
              <p>{meta.bans?.maps_b?.join(", ") || "—"}</p>
            </div>
          </div>
        </section>
      )}

      {meta.brawlers && (
        <section className="bf-match-detail-panel">
          <h2 className="bf-match-detail-h2">Brawlers</h2>
          <p className="bf-match-detail-note">Meta, picks y bans de brawlers — estructura lista en admin.</p>
        </section>
      )}

      {h2h.length > 0 && (
        <section className="bf-match-detail-panel">
          <h2 className="bf-match-detail-h2">Historial H2H</h2>
          <ul className="bf-match-detail-list">
            {h2h.map((m) => (
              <li key={m.id}>
                <Link href={`/matches/${m.id}`}>
                  {teamName(m.teamASlug)} {m.scoreA}-{m.scoreB} {teamName(m.teamBSlug)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bf-match-detail-panel">
        <h2 className="bf-match-detail-h2">Últimos partidos</h2>
        <div className="bf-match-detail-recent-grid">
          <div>
            <h3>{teamName(match.teamASlug)}</h3>
            <ul className="bf-match-detail-list">
              {recentA.map((m) => (
                <li key={m.id}>
                  <Link href={`/matches/${m.id}`}>
                    vs {teamName(m.teamASlug === match.teamASlug ? m.teamBSlug : m.teamASlug)} · {m.scoreA}-{m.scoreB}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{teamName(match.teamBSlug)}</h3>
            <ul className="bf-match-detail-list">
              {recentB.map((m) => (
                <li key={m.id}>
                  <Link href={`/matches/${m.id}`}>
                    vs {teamName(m.teamBSlug === match.teamBSlug ? m.teamASlug : m.teamBSlug)} · {m.scoreA}-{m.scoreB}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
