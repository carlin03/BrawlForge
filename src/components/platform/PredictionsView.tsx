"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MatchLine } from "@/components/platform/ui";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";
import type { PredictionEvent } from "@/lib/data/predictions";
import {
  isKnownTeamSlug,
  getRecentMatches,
  getPredictionVotingActivity,
  getStreakLeaders,
  userPredictorProfile,
} from "@/lib/data";

export function PredictionsView({ open, closed }: { open: PredictionEvent[]; closed: PredictionEvent[] }) {
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const displayOpen = useMemo(
    () => open.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)),
    [open],
  );
  const displayClosed = useMemo(
    () => closed.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)),
    [closed],
  );
  const list = filter === "open" ? displayOpen : displayClosed;
  const featured = filter === "open" ? list[0] : null;
  const rest = filter === "open" ? list.slice(1) : list;
  const recent = getRecentMatches().filter((m) => isKnownTeamSlug(m.teamASlug)).slice(0, 4);
  const voteActivity = SHOW_DEMO_SOCIAL ? getPredictionVotingActivity(6) : [];
  const streakLeaders = SHOW_DEMO_SOCIAL ? getStreakLeaders(5) : [];

  return (
    <div className="bf-predict-page">
      <header className="bf-fantasy-gate">
        <div className="bf-fantasy-gate-left">
          <span className="bf-home-gate-badge">Vota</span>
          <div>
            <h1 className="bf-fantasy-title">Predicciones</h1>
            <p className="bf-fantasy-sub">
              Elige ganador · partidos reales del circuito · logos PNG
            </p>
          </div>
        </div>
        <div className="bf-fantasy-gate-actions">
          <Link href="/matches" className="bp-btn bp-btn-ghost">Partidos</Link>
          <Link href="/fantasy" className="bp-btn bp-btn-gold">Fantasy</Link>
        </div>
      </header>

      {SHOW_DEMO_SOCIAL && userPredictorProfile.streak >= 2 && (
        <div className="bp-streak-banner">
          <strong>Racha {userPredictorProfile.streak}W</strong>
          <span>{userPredictorProfile.totalPoints} pts · {userPredictorProfile.accuracy}% acierto</span>
        </div>
      )}

      <div className="bf-home-tabs">
        <button type="button" className={`bf-home-tab ${filter === "open" ? "is-on" : ""}`} onClick={() => setFilter("open")}>
          Abiertas <span className="bf-home-tab-count">{displayOpen.length}</span>
        </button>
        <button type="button" className={`bf-home-tab ${filter === "closed" ? "is-on" : ""}`} onClick={() => setFilter("closed")}>
          Historial <span className="bf-home-tab-count">{displayClosed.length}</span>
        </button>
      </div>

      <div className="bf-predict-layout">
        <div className="bf-predict-main">
          {featured && <InteractiveVoteCard event={featured} featured />}
          <div className="bf-predict-grid">
            {rest.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
          {list.length === 0 && <p className="bf-home-empty">Sin votaciones en esta pestaña.</p>}

          {recent.length > 0 && filter === "open" && (
            <section className="bf-predict-context">
              <div className="bf-home-block-head">
                <h2 className="bf-home-block-title">Contexto reciente</h2>
                <Link href="/matches" className="bf-home-link">Calendario</Link>
              </div>
              <div className="bf-predict-matches">
                {recent.map((m) => (
                  <MatchLine key={m.id} match={m} compact rich />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="bf-fantasy-aside">
          <div className="bf-fantasy-aside-card">
            <span className="bf-home-eyebrow">Cómo jugar</span>
            <ul className="bf-fantasy-rules">
              <li>Toca el equipo que crees que gana</li>
              <li>Puntos según formato Bo3 / Bo5</li>
              <li>Datos de partidos Liquipedia Tier B+</li>
              <li>Pronto: guardar votos en Supabase</li>
            </ul>
          </div>

          {SHOW_DEMO_SOCIAL && voteActivity.length > 0 ? (
            <div className="bf-fantasy-aside-card">
              <span className="bf-home-eyebrow">Actividad</span>
              {voteActivity.map((v) => (
                <div key={v.id} className="bf-fantasy-rank-row">
                  <span>{v.text}</span>
                  <span className="bf-feed-ago">{v.ago}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bf-fantasy-aside-card is-muted">
              <span className="bf-home-eyebrow">Comunidad</span>
              <p>Los votos globales y rachas aparecerán cuando conectemos la base en vivo.</p>
            </div>
          )}

          {SHOW_DEMO_SOCIAL && streakLeaders.length > 0 && (
            <div className="bf-fantasy-aside-card">
              <span className="bf-home-eyebrow">Rachas</span>
              {streakLeaders.map((p) => (
                <div key={p.username} className="bf-fantasy-rank-row">
                  <span>{p.streak}W</span>
                  <strong>{p.username}</strong>
                  <span className="gold">{p.points}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
