"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Trophy, Users, Zap } from "lucide-react";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { SectionTabsBar } from "@/components/platform/SectionTabsBar";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import {
  tierBadgeClass,
  tierLabel,
  getTierBPlusTournaments,
  getTournamentParticipantSlugs,
  getMatchesByTournament,
  teamName,
  isKnownTeamSlug,
} from "@/lib/data";

type StatusFilter = "all" | "live" | "upcoming" | "finished";

function cleanName(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function formatTourDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (start === end) return s.toLocaleDateString("es-ES", { ...opts, year: "numeric" });
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`;
  }
  return `${s.toLocaleDateString("es-ES", opts)} – ${e.toLocaleDateString("es-ES", { ...opts, year: "numeric" })}`;
}

export function TournamentsView() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const all = useMemo(() => getTierBPlusTournaments(48), []);
  const liveCount = all.filter((t) => t.status === "live").length;

  const filtered = useMemo(() => {
    if (status === "all") return all;
    return all.filter((t) => t.status === status);
  }, [all, status]);

  const heroShowcase = filtered[0] ?? all[0];

  return (
    <PageUltraShell className="bf-tours-hub">
      <header className="bf-tours-hub-hero">
        <div>
          <p className="bf-tours-hub-kicker">
            <Trophy size={14} aria-hidden /> Brawl Stars Championship
          </p>
          <h1>
            Torneos <em>2026</em>
          </h1>
          <p>Premios, fechas, participantes verificados y partidos del circuito S / A / B.</p>
        </div>
        <div className="bf-tours-hub-hero-stats">
          <div>
            <b>{all.length}</b>
            <span>Eventos</span>
          </div>
          <div className={liveCount > 0 ? "has-live" : ""}>
            <b>{liveCount || "—"}</b>
            <span>En directo</span>
          </div>
          <div>
            <b>{filtered.length}</b>
            <span>En vista</span>
          </div>
        </div>
        <div className="bf-tours-hub-hero-actions">
          <Link href="/matches" className="fu-btn fu-btn-red">
            Partidos
          </Link>
          <Link href="/predictions" className="fu-btn fu-btn-gold">
            Predicciones
          </Link>
        </div>
        {heroShowcase && (
          <Link href={`/tournaments/${heroShowcase.slug}`} className="bf-tours-hub-hero-logo">
            <TournamentLogo slug={heroShowcase.slug} name={cleanName(heroShowcase.shortName)} size={140} glow />
            <span>{cleanName(heroShowcase.shortName)}</span>
            {heroShowcase.tier != null && (
              <span className={`bf-tier-badge ${tierBadgeClass(heroShowcase.tier)}`}>{tierLabel(heroShowcase.tier)}</span>
            )}
          </Link>
        )}
      </header>

      <SectionTabsBar
        entityLogo={
          heroShowcase ? (
            <TournamentLogo slug={heroShowcase.slug} name={cleanName(heroShowcase.shortName)} size={48} glow />
          ) : (
            <TournamentLogo slug="bsc-2026-brawl-cup" name="BSC 2026" size={48} glow />
          )
        }
      >
        <div className="bf-tours-hub-tabs">
          {(["all", "live", "upcoming", "finished"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`bf-tours-hub-tab ${status === s ? "is-on" : ""} ${s === "live" && liveCount ? "has-live" : ""}`}
              onClick={() => setStatus(s)}
            >
              {s === "all" ? "Todos" : s === "live" ? `Directo (${liveCount})` : s === "upcoming" ? "Próximos" : "Finalizados"}
            </button>
          ))}
        </div>
      </SectionTabsBar>

      <div className="bf-tours-hub-grid">
        {filtered.map((t) => {
          const participants = getTournamentParticipantSlugs(t.slug).filter(isKnownTeamSlug);
          const matchCount = getMatchesByTournament(t.slug).length;
          const name = cleanName(t.shortName);
          const showTeams = participants.slice(0, 12);
          const moreTeams = participants.length - showTeams.length;

          return (
            <article key={t.slug} className={`bf-tour-hub-card status-${t.status}`}>
              <Link href={`/tournaments/${t.slug}`} className="bf-tour-hub-card-link">
                <div className="bf-tour-hub-card-head">
                  <div className="bf-tour-hub-logo-wrap">
                    <TournamentLogo slug={t.slug} name={name} size={72} glow />
                  </div>
                  <div className="bf-tour-hub-card-titles">
                    <strong>{name}</strong>
                    <span className="bf-tour-hub-card-full">{cleanName(t.name)}</span>
                    <div className="bf-tour-hub-card-chips">
                      <RegionBadge region={t.region} />
                      {t.tier != null && (
                        <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                      )}
                      <span className={`bf-tour-hub-status status-${t.status}`}>
                        {t.status === "live" ? (
                          <>
                            <Zap size={10} /> LIVE
                          </>
                        ) : t.status === "upcoming" ? (
                          "Próximo"
                        ) : (
                          "Finalizado"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <dl className="bf-tour-hub-facts">
                  <div>
                    <dt>
                      <Trophy size={12} aria-hidden /> Premio
                    </dt>
                    <dd>{t.prizePool}</dd>
                  </div>
                  <div>
                    <dt>
                      <Users size={12} aria-hidden /> Equipos
                    </dt>
                    <dd>{participants.length || t.teams}</dd>
                  </div>
                  <div>
                    <dt>
                      <Calendar size={12} aria-hidden /> Fechas
                    </dt>
                    <dd>{formatTourDate(t.startDate, t.endDate)}</dd>
                  </div>
                  <div>
                    <dt>
                      <MapPin size={12} aria-hidden /> Sede
                    </dt>
                    <dd>{t.location}</dd>
                  </div>
                  {matchCount > 0 && (
                    <div>
                      <dt>Partidos</dt>
                      <dd>{matchCount} en calendario</dd>
                    </div>
                  )}
                  <div className="wide">
                    <dt>Fase</dt>
                    <dd>{t.stage}</dd>
                  </div>
                </dl>

                {showTeams.length > 0 && (
                  <div className="bf-tour-hub-teams">
                    <span className="bf-tour-hub-teams-label">Participantes</span>
                    <div className="bf-tour-hub-teams-logos">
                      {showTeams.map((slug) => (
                        <TeamLogo key={slug} slug={slug} name={teamName(slug)} size={32} glow={false} />
                      ))}
                    </div>
                    <ul className="bf-tour-hub-teams-names">
                      {(participants.length <= 16 ? participants : showTeams).map((slug) => (
                        <li key={slug}>{teamName(slug)}</li>
                      ))}
                      {participants.length > 16 && moreTeams > 0 && (
                        <li className="is-more">+{moreTeams} más</li>
                      )}
                    </ul>
                  </div>
                )}

                <span className="bf-tour-hub-cta">Ver torneo →</span>
              </Link>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="bf-home-empty">No hay torneos en esta categoría.</p>}
    </PageUltraShell>
  );
}
