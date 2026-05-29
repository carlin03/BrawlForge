"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Target, Trophy, Flame, Calendar } from "lucide-react";
import { MatchLine } from "@/components/platform/ui";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import { isKnownTeamSlug, getRecentMatches, teamName } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

export function PredictionsView({ open, closed }: { open: PredictionEvent[]; closed: PredictionEvent[] }) {
  const { isLoggedIn, profile } = useAuth();
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

  return (
    <div className="bf-page-ultra bf-motion-page bf-predict-page bf-predict-bsc">
      <header className="bf-bsc-predict-hero">
        <div className="bf-bsc-predict-hero-bg" aria-hidden>
          <div className="bf-bsc-predict-hero-blue" />
          <div className="bf-bsc-predict-hero-red" />
          <div className="bf-bsc-predict-hero-line" />
        </div>
        <div className="bf-bsc-predict-hero-grid">
          <div className="bf-bsc-predict-hero-copy">
            <p className="bf-bsc-predict-kicker">
              <Target size={14} aria-hidden />
              Predicciones BSC 2026
            </p>
            <h1 className="bf-bsc-predict-title">
              <span className="bf-bsc-predict-title-blue">Azul</span>
              <span className="bf-bsc-predict-title-vs">vs</span>
              <span className="bf-bsc-predict-title-red">Rojo</span>
            </h1>
            <p className="bf-bsc-predict-lead">
              Elige el ganador de cada partido. Lado izquierdo <strong className="is-blue">AZUL</strong>, derecho{" "}
              <strong className="is-red">ROJO</strong>. Las barras solo muestran votos reales de la comunidad.
            </p>
            <div className="bf-bsc-predict-stats">
              <div className="bf-bsc-predict-stat is-blue">
                <b>{displayOpen.length}</b>
                <span>Abiertas</span>
              </div>
              <div className="bf-bsc-predict-stat is-red">
                <b>{displayClosed.length}</b>
                <span>Cerradas</span>
              </div>
              <div className="bf-bsc-predict-stat is-neutral">
                <b>{isLoggedIn ? profile?.predictPoints ?? 0 : "—"}</b>
                <span>{isLoggedIn ? "Tus puntos" : "Inicia sesión"}</span>
              </div>
            </div>
            <div className="bf-bsc-predict-actions">
              <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-blue">
                <Calendar size={16} aria-hidden />
                Calendario
              </Link>
              <Link href="/fantasy" className="bf-bsc-btn bf-bsc-btn-red">
                Fantasy
              </Link>
              {!isLoggedIn && (
                <Link href="/login?next=/predictions" className="bf-bsc-btn bf-bsc-btn-blue">
                  Entrar y predecir
                </Link>
              )}
            </div>
          </div>

          {featured ? (
            <div className="bf-bsc-predict-duel" aria-hidden={false}>
              <div className="bf-bsc-predict-duel-side is-blue">
                <TeamLogo slug={featured.teamASlug} name={teamName(featured.teamASlug)} size={96} glow />
                <span>{teamName(featured.teamASlug)}</span>
                <em>AZUL</em>
              </div>
              <span className="bf-bsc-predict-duel-vs">VS</span>
              <div className="bf-bsc-predict-duel-side is-red">
                <TeamLogo slug={featured.teamBSlug} name={teamName(featured.teamBSlug)} size={96} glow />
                <span>{teamName(featured.teamBSlug)}</span>
                <em>ROJO</em>
              </div>
            </div>
          ) : (
            <div className="bf-bsc-predict-duel is-empty">
              <Trophy size={48} className="bf-bsc-predict-duel-icon" aria-hidden />
              <span>Próximas predicciones</span>
            </div>
          )}
        </div>
      </header>

      {isLoggedIn && (profile?.predictStreak ?? 0) >= 2 && (
        <div className="bf-bsc-predict-streak">
          <Flame size={18} aria-hidden />
          <div>
            <strong>Racha de {profile?.predictStreak} aciertos</strong>
            <span>{profile?.predictPoints ?? 0} puntos acumulados</span>
          </div>
        </div>
      )}

      <div className="bf-bsc-predict-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "open"}
          className={`bf-bsc-predict-tab is-blue ${filter === "open" ? "is-on" : ""}`}
          onClick={() => setFilter("open")}
        >
          Abiertas <span>{displayOpen.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "closed"}
          className={`bf-bsc-predict-tab is-red ${filter === "closed" ? "is-on" : ""}`}
          onClick={() => setFilter("closed")}
        >
          Historial <span>{displayClosed.length}</span>
        </button>
      </div>

      <div className="bf-bsc-predict-layout">
        <main className="bf-bsc-predict-main">
          {featured && (
            <section className="bf-bsc-predict-featured">
              <h2 className="bf-bsc-predict-section-label">
                <span className="is-blue">Destacado</span>
                <span className="bf-bsc-predict-section-dash" aria-hidden />
                <span className="is-red">Bo5 / finales</span>
              </h2>
              <InteractiveVoteCard event={featured} featured />
            </section>
          )}

          {rest.length > 0 && (
            <section className="bf-bsc-predict-list">
              <h2 className="bf-bsc-predict-section-title">Más partidos</h2>
              <div className="bf-bsc-predict-grid">
                {rest.map((e) => (
                  <InteractiveVoteCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}

          {list.length === 0 && (
            <div className="bf-bsc-predict-empty">
              <p>No hay predicciones en esta pestaña.</p>
              <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-ghost">
                Ver calendario BSC
              </Link>
            </div>
          )}

          {recent.length > 0 && filter === "open" && (
            <section className="bf-bsc-predict-context">
              <div className="bf-bsc-predict-context-head">
                <h2>Resultados recientes</h2>
                <Link href="/matches">Calendario completo</Link>
              </div>
              <div className="bf-bsc-predict-context-matches">
                {recent.map((m) => (
                  <MatchLine key={m.id} match={m} compact rich />
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="bf-bsc-predict-aside">
          <div className="bf-bsc-predict-aside-card">
            <h3>Cómo funciona</h3>
            <ul>
              <li>
                <span className="dot is-blue" aria-hidden />
                Toca el lado <strong>AZUL</strong> (equipo A)
              </li>
              <li>
                <span className="dot is-red" aria-hidden />
                o el lado <strong>ROJO</strong> (equipo B)
              </li>
              <li>Más puntos en finales Bo5 que en grupos Bo3</li>
              <li>Sin votos = sin porcentajes inventados</li>
            </ul>
          </div>
          <div className="bf-bsc-predict-aside-card is-split">
            <p>
              Cada barra refleja solo predicciones de usuarios registrados en BrawlForge — comunidad real, no datos
              falsos.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
