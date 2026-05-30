"use client";

import Link from "next/link";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { DuelLogoShowcase, PageUltraHero } from "@/components/platform/PageUltraHero";
import { MatchEsportsExperience } from "@/components/match-esports/MatchEsportsExperience";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  getMatch,
  teamName,
} from "@/lib/data";
import type { EsportsMatch } from "@/lib/data/matches";
import { getTeam } from "@/lib/data";
import { FormDots } from "@/components/platform/ui";

export function MatchDetailView({ match: matchProp, id }: { match?: EsportsMatch; id?: string }) {
  const match = matchProp ?? (id ? getMatch(id) : undefined);
  if (!match) {
    return (
      <PageUltraShell>
        <div className="fu-panel bf-home-empty">
          <p>Partido no encontrado.</p>
          <Link href="/matches" className="fu-btn fu-btn-ghost">
            Ver partidos
          </Link>
        </div>
      </PageUltraShell>
    );
  }

  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const winA = match.status === "finished" && match.scoreA > match.scoreB;
  const winB = match.status === "finished" && match.scoreB > match.scoreA;

  const scoreBlock =
    match.status === "upcoming" ? (
      <span className="fu-duel-vs">VS</span>
    ) : (
      <div className="fu-match-score-hero">
        <span className={winA ? "is-win" : ""}>{match.scoreA}</span>
        <span style={{ color: "var(--bp-dim)", margin: "0 12px" }}>–</span>
        <span className={winB ? "is-win" : ""}>{match.scoreB}</span>
      </div>
    );

  return (
    <PageUltraShell className="bf-match-detail-ultra">
      <PageUltraHero
        kicker={null}
        title={
          <>
            {teamName(match.teamASlug)} <em>vs</em> {teamName(match.teamBSlug)}
          </>
        }
        lead={new Date(match.date).toLocaleString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })}
        showcase={
          <div className="fu-duel-showcase">
            <Link href={`/teams/${match.teamASlug}`} className="fu-duel-logo fu-card-float fu-card-float-1">
              <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={96} glow />
              <span>{teamName(match.teamASlug)}</span>
              {teamA && <FormDots form={teamA.form} />}
            </Link>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2 }}>
              {scoreBlock}
            </div>
            <Link href={`/teams/${match.teamBSlug}`} className="fu-duel-logo fu-card-float fu-card-float-3">
              <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={96} glow />
              <span>{teamName(match.teamBSlug)}</span>
              {teamB && <FormDots form={teamB.form} />}
            </Link>
          </div>
        }
        actions={
          <a href="#match-predictions" className="fu-btn fu-btn-red">
            Ir a predicciones
          </a>
        }
      />

      <MatchEsportsExperience match={match} />
    </PageUltraShell>
  );
}
