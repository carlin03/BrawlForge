"use client";

import Link from "next/link";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { DuelLogoShowcase, PageUltraHero } from "@/components/platform/PageUltraHero";
import { Panel, FormDots } from "@/components/platform/ui";
import { MatchVotePanel } from "@/components/platform/MatchVotePanel";
import { MatchDetailExtras } from "@/components/platform/MatchDetailExtras";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  getMatch,
  getTeam,
  teamName,
  tournamentName,
  matches,
  getPlayersByTeam,
  getFantasyRole,
} from "@/lib/data";
import { getPlayerPrice } from "@/lib/data/fantasy";

export function MatchDetailView({ id }: { id: string }) {
  const match = getMatch(id);
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
  const h2h = matches
    .filter(
      (m) =>
        m.id !== match.id &&
        m.status === "finished" &&
        ((m.teamASlug === match.teamASlug && m.teamBSlug === match.teamBSlug) ||
          (m.teamASlug === match.teamBSlug && m.teamBSlug === match.teamASlug)),
    )
    .slice(0, 5);
  const rosterA = getPlayersByTeam(match.teamASlug).slice(0, 4);
  const rosterB = getPlayersByTeam(match.teamBSlug).slice(0, 4);

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
        kicker={
          <>
            <Link href={`/tournaments/${match.tournamentSlug}`} className="bp-chip bp-chip-blue">
              <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={18} />
              {tournamentName(match.tournamentSlug)}
            </Link>
            <span className="bp-chip">{match.stage}</span>
            <span className="bp-chip">{match.format}</span>
            {match.status === "live" && (
              <span className="bp-chip bp-chip-live">
                <span className="bp-live-dot" /> En directo
              </span>
            )}
          </>
        }
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
          <>
            <Link href="/predictions" className="fu-btn fu-btn-red">
              Predicciones
            </Link>
            <Link href={`/teams/${match.teamASlug}`} className="fu-btn fu-btn-ghost">
              {teamA?.tag ?? "A"}
            </Link>
            <Link href={`/teams/${match.teamBSlug}`} className="fu-btn fu-btn-ghost">
              {teamB?.tag ?? "B"}
            </Link>
          </>
        }
      />

      <div className="bp-detail-grid bf-stagger">
        <Panel title="Predicción comunidad" className="fu-panel-glow">
          <div className="bp-panel-body-pad">
            <MatchVotePanel matchId={match.id} />
          </div>
        </Panel>

        <Panel title="Rosters en juego" className="fu-panel-glow">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bp-line)" }}>
            {[rosterA, rosterB].map((roster, side) => (
              <div key={side} style={{ background: "var(--bp-panel)" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    fontSize: 12,
                    fontWeight: 800,
                    borderBottom: "1px solid var(--bp-line)",
                  }}
                >
                  {side === 0 ? teamName(match.teamASlug) : teamName(match.teamBSlug)}
                </div>
                {roster.map(
                  (p) =>
                    p && (
                      <Link key={p.slug} href={`/players/${p.slug}`} className="bp-row">
                        <div className="bp-row-main">
                          <div className="bp-row-title">{p.ign}</div>
                          <div className="bp-row-sub">
                            {getFantasyRole(p.slug)} · OVR {p.fantasyPoints}
                          </div>
                        </div>
                        <span className="bp-row-stat gold">{getPlayerPrice(p.slug)}M</span>
                      </Link>
                    ),
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <MatchDetailExtras match={match} />

      {h2h.length > 0 && (
        <Panel title="Historial cara a cara" flush className="fu-panel-glow">
          {h2h.map((m) => {
            const a = m.teamASlug === match.teamASlug ? m.teamASlug : m.teamBSlug;
            const b = m.teamASlug === match.teamASlug ? m.teamBSlug : m.teamASlug;
            const scoreOur =
              m.teamASlug === match.teamASlug ? `${m.scoreA}-${m.scoreB}` : `${m.scoreB}-${m.scoreA}`;
            return (
              <div key={m.id} className="bp-row">
                <div className="bp-row-main">
                  <div className="bp-row-title">
                    {teamName(a)} vs {teamName(b)}
                  </div>
                  <div className="bp-row-sub">{m.stage}</div>
                </div>
                <span className="bp-row-stat">{scoreOur}</span>
              </div>
            );
          })}
        </Panel>
      )}
    </PageUltraShell>
  );
}
