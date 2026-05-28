"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Target, Trophy, Flame, Clock } from "lucide-react";
import { MatchLine } from "@/components/platform/ui";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
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
    <PageUltraShell className="bf-predict-page bf-predict-ultra bf-arena-page bf-arena-static">
      <PageUltraHero
        kicker={
          <>
            <Target size={14} /> Predicciones BSC
          </>
        }
        title={
          <>
            Acierta el <em>ganador</em>
          </>
        }
        lead="Elige club en partidos reales del circuito 2026. Los porcentajes son solo votos de la comunidad."
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="fu-stat">
              <b>{displayOpen.length}</b>
              <span>Abiertas</span>
            </div>
            <div className="fu-stat">
              <b>{displayClosed.length}</b>
              <span>Cerradas</span>
            </div>
            <div className="fu-stat">
              <b>{isLoggedIn ? profile?.predictPoints ?? 0 : "—"}</b>
              <span>{isLoggedIn ? "Tus puntos" : "Entra y predice"}</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href="/matches" className="fu-btn fu-btn-ghost">
              Calendario
            </Link>
            <Link href="/fantasy" className="fu-btn fu-btn-gold">
              Fantasy
            </Link>
            {!isLoggedIn && (
              <Link href="/login?next=/predictions" className="fu-btn fu-btn-red">
                Entrar y predecir
              </Link>
            )}
          </>
        }
        showcase={
          featured ? (
            <div className="bf-arena-duel-static" aria-hidden={false}>
              <div className="bf-arena-duel-side">
                <TeamLogo slug={featured.teamASlug} name={teamName(featured.teamASlug)} size={88} glow />
                <span>{teamName(featured.teamASlug)}</span>
              </div>
              <span className="fu-duel-vs">VS</span>
              <div className="bf-arena-duel-side">
                <TeamLogo slug={featured.teamBSlug} name={teamName(featured.teamBSlug)} size={88} glow />
                <span>{teamName(featured.teamBSlug)}</span>
              </div>
            </div>
          ) : (
            <div className="bf-arena-duel-static bf-arena-duel-empty">
              <Trophy size={48} color="var(--bp-gold)" />
              <span>Próximas predicciones</span>
            </div>
          )
        }
      />

      {isLoggedIn && (profile?.predictStreak ?? 0) >= 2 && (
        <div className="bp-streak-banner bf-predict-streak">
          <Flame size={18} />
          <div>
            <strong>Racha {profile?.predictStreak} aciertos</strong>
            <span>{profile?.predictPoints ?? 0} puntos acumulados</span>
          </div>
        </div>
      )}

      <div className="fu-tabs bf-arena-tabs" style={{ justifyContent: "center" }}>
        <button
          type="button"
          className={`fu-tab ${filter === "open" ? "is-on" : ""}`}
          onClick={() => setFilter("open")}
        >
          Abiertas ({displayOpen.length})
        </button>
        <button
          type="button"
          className={`fu-tab ${filter === "closed" ? "is-on" : ""}`}
          onClick={() => setFilter("closed")}
        >
          Historial ({displayClosed.length})
        </button>
      </div>

      <div className="bf-predict-layout">
        <div className="bf-predict-main">
          {featured && (
            <section className="bf-predict-featured-wrap">
              <span className="bf-predict-featured-label">Partido destacado</span>
              <InteractiveVoteCard event={featured} featured />
            </section>
          )}

          {rest.length > 0 && (
            <section className="bf-predict-grid-section">
              <h2 className="bf-arena-section-title">Más predicciones</h2>
              <div className="bf-predict-grid">
                {rest.map((e) => (
                  <InteractiveVoteCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}

          {list.length === 0 && (
            <div className="bf-predict-empty fu-panel">
              <p>No hay predicciones en esta pestaña.</p>
              <Link href="/matches" className="fu-btn fu-btn-ghost">
                Ver calendario
              </Link>
            </div>
          )}

          {recent.length > 0 && filter === "open" && (
            <section className="fu-panel bf-arena-context">
              <div className="fu-panel-head">
                <h2>Contexto reciente</h2>
                <Link href="/matches">Calendario</Link>
              </div>
              <div className="bf-predict-matches">
                {recent.map((m) => (
                  <MatchLine key={m.id} match={m} compact rich />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="bf-predict-aside">
          <div className="fu-panel">
            <span className="fu-kicker" style={{ marginBottom: 12 }}>
              Cómo funciona
            </span>
            <ul className="bf-predict-rules">
              <li>Elige el equipo que crees que gana</li>
              <li>Más puntos en finales Bo5 que en grupos Bo3</li>
              <li>Sin votos = sin porcentaje falso</li>
              <li>Tu predicción se guarda al instante</li>
            </ul>
          </div>
          <div className="fu-panel">
            <span className="fu-kicker" style={{ marginBottom: 12 }}>
              <Clock size={12} /> Comunidad
            </span>
            <p className="bf-predict-aside-text">
              Cada barra refleja solo predicciones reales de usuarios registrados en BrawlForge.
            </p>
          </div>
        </aside>
      </div>
    </PageUltraShell>
  );
}
