"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Zap } from "lucide-react";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import { getTierBPlusTournaments, getTournamentParticipantSlugs, teamName, isKnownTeamSlug } from "@/lib/data";

type StatusFilter = "all" | "live" | "upcoming" | "finished";

function cleanName(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function TournamentsView() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const all = useMemo(() => getTierBPlusTournaments(48), []);
  const liveCount = all.filter((t) => t.status === "live").length;

  const filtered = useMemo(() => {
    if (status === "all") return all;
    return all.filter((t) => t.status === status);
  }, [all, status]);

  const marquee = useMemo(() => {
    const live = all.filter((t) => t.status === "live");
    const pool = live.length > 0 ? live : all.filter((t) => t.status === "upcoming").slice(0, 12);
    return [...pool, ...pool];
  }, [all]);

  const heroShowcase = filtered[0] ?? all[0];

  return (
    <PageUltraShell className="bf-tours-ultra">
      <PageUltraHero
        kicker={
          <>
            <Trophy size={14} /> Brawl Stars Championship
          </>
        }
        title={
          <>
            Torneos <em>2026</em>
          </>
        }
        lead="S · A · B tier · premios, participantes y calendario de partidos en un solo hub."
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="fu-stat">
              <b>{all.length}</b>
              <span>Eventos</span>
            </div>
            <div className="fu-stat">
              <b>{liveCount || "—"}</b>
              <span>En directo</span>
            </div>
            <div className="fu-stat">
              <b>{filtered.length}</b>
              <span>En vista</span>
            </div>
            <div className="fu-stat">
              <b>B+</b>
              <span>Circuito</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href="/matches" className="fu-btn fu-btn-red">
              Partidos
            </Link>
            <Link href="/predictions" className="fu-btn fu-btn-gold">
              Predicciones
            </Link>
            <Link href="/fantasy" className="fu-btn fu-btn-ghost">
              Fantasy
            </Link>
          </>
        }
        showcase={
          heroShowcase ? (
            <Link href={`/tournaments/${heroShowcase.slug}`} className="fu-duel-showcase" style={{ textDecoration: "none" }}>
              <div className="fu-duel-logo fu-card-float fu-card-float-2">
                <TournamentLogo slug={heroShowcase.slug} name={cleanName(heroShowcase.shortName)} size={120} glow />
                <span>{cleanName(heroShowcase.shortName)}</span>
                {heroShowcase.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(heroShowcase.tier)}`}>{tierLabel(heroShowcase.tier)}</span>
                )}
              </div>
            </Link>
          ) : undefined
        }
      />

      {marquee.length > 0 && (
        <div className="fu-tour-marquee-wrap">
          <div className="fu-tour-marquee-track">
            {marquee.map((t, i) => (
              <Link key={`${t.slug}-${i}`} href={`/tournaments/${t.slug}`} className="fu-tour-marquee-item">
                <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={52} glow={false} />
                <span>{cleanName(t.shortName)}</span>
                {t.status === "live" && (
                  <span className="bp-chip bp-chip-live" style={{ fontSize: 8, padding: "2px 6px" }}>
                    LIVE
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="fu-tabs">
        {(["all", "live", "upcoming", "finished"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`fu-tab ${status === s ? "is-on" : ""} ${s === "live" && liveCount ? "has-live" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s === "all" ? "Todos" : s === "live" ? `Directo (${liveCount})` : s === "upcoming" ? "Próximos" : "Finalizados"}
          </button>
        ))}
      </div>

      <div className="bf-tours-grid bf-stagger bf-motion-grid">
        {filtered.map((t) => {
          const participants = getTournamentParticipantSlugs(t.slug).filter(isKnownTeamSlug).slice(0, 6);
          const name = cleanName(t.shortName);
          return (
            <Link
              key={t.slug}
              href={`/tournaments/${t.slug}`}
              className={`bf-tour-card-lg status-${t.status}`}
            >
              <div className="bf-tour-card-lg-glow" aria-hidden />
              <div className="bf-tour-card-lg-top">
                <TournamentLogo slug={t.slug} name={name} size={56} glow />
                {t.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                )}
              </div>
              <strong>{name}</strong>
              <span className="bf-tour-card-meta">
                {t.prizePool} · {t.region}
              </span>
              <span className={`bf-home-tour-status status-${t.status}`}>
                {t.status === "live" ? (
                  <>
                    <Zap size={10} /> En directo
                  </>
                ) : t.status === "upcoming" ? (
                  "Próximo"
                ) : (
                  "Finalizado"
                )}
              </span>
              {participants.length > 0 && (
                <div className="bf-tour-card-teams">
                  {participants.map((slug) => (
                    <TeamLogo key={slug} slug={slug} name={teamName(slug)} size={28} />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="bf-home-empty fu-panel">No hay torneos en esta categoría.</p>}
    </PageUltraShell>
  );
}
