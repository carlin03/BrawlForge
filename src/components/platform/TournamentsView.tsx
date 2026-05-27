"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

  const filtered = useMemo(() => {
    if (status === "all") return all;
    return all.filter((t) => t.status === status);
  }, [all, status]);

  return (
    <div className="bf-tours-page">
      <header className="bf-fantasy-gate">
        <div className="bf-fantasy-gate-left">
          <span className="bf-home-gate-badge">Tier B+</span>
          <div>
            <h1 className="bf-fantasy-title">Torneos</h1>
            <p className="bf-fantasy-sub">S · A · B tier · logos PNG Liquipedia</p>
          </div>
        </div>
        <Link href="/matches" className="bp-btn bp-btn-blue">Calendario</Link>
      </header>

      <div className="bf-home-tabs" role="tablist">
        {(["all", "live", "upcoming", "finished"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            className={`bf-home-tab ${status === s ? "is-on" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s === "all" ? "Todos" : s === "live" ? "En directo" : s === "upcoming" ? "Próximos" : "Finalizados"}
          </button>
        ))}
      </div>

      <div className="bf-tours-grid">
        {filtered.map((t) => {
          const participants = getTournamentParticipantSlugs(t.slug)
            .filter(isKnownTeamSlug)
            .slice(0, 6);
          const name = cleanName(t.shortName);
          return (
            <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-tour-card-lg">
              <div className="bf-tour-card-lg-glow" aria-hidden />
              <div className="bf-tour-card-lg-top">
                <TournamentLogo slug={t.slug} name={name} size={56} />
                {t.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                )}
              </div>
              <strong>{name}</strong>
              <span className="bf-tour-card-meta">{t.prizePool} · {t.region}</span>
              <span className={`bf-home-tour-status status-${t.status}`}>
                {t.status === "live" ? "En directo" : t.status === "upcoming" ? "Próximo" : "Finalizado"}
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

      {filtered.length === 0 && (
        <p className="bf-home-empty">No hay torneos en esta categoría.</p>
      )}
    </div>
  );
}
