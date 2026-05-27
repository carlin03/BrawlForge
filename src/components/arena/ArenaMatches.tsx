"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArenaMatchLine, ArenaPanel, ArenaBadge } from "./ArenaUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  getCuratedHomeMatches,
  getLiveMatches,
  getUpcomingMatches,
  getFeaturedTournaments,
  isKnownTeamSlug,
  teamName,
  getTeam,
} from "@/lib/data";

export function ArenaMatches() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const upcoming = getUpcomingMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "upcoming");
  const matches = useMemo(() => getCuratedHomeMatches(tab, 30), [tab]);
  const featuredTournaments = getFeaturedTournaments(4).filter((t) => t.status !== "finished");

  const nextMatch = upcoming[0];
  const nextDate = nextMatch ? new Date(nextMatch.date) : null;

  return (
    <>
      <div className="ar-page-head">
        <h1 className="ar-h1">Partidos</h1>
        <p className="ar-lead">Calendario competitivo · equipos confirmados · contexto de torneo en cada serie.</p>
      </div>

      <div className="ar-meta-row">
        <div className="ar-meta-item">
          <strong style={{ color: live.length ? "var(--ar-live)" : undefined }}>{live.length}</strong>
          <span>En directo</span>
        </div>
        <div className="ar-meta-item">
          <strong>{upcoming.length}</strong>
          <span>Próximos</span>
        </div>
        <div className="ar-meta-item">
          <strong>{featuredTournaments.length}</strong>
          <span>Torneos activos</span>
        </div>
        {nextDate && (
          <div className="ar-meta-item">
            <strong style={{ fontSize: "1.1rem" }}>
              {nextDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </strong>
            <span>Próximo inicio</span>
          </div>
        )}
      </div>

      <div className="ar-matches-layout">
        <ArenaPanel
          title="Calendario"
          tabs={
            <div className="ar-tabs">
              <button type="button" className={`ar-tab is-live ${tab === "live" ? "is-on" : ""}`} onClick={() => setTab("live")}>Directo</button>
              <button type="button" className={`ar-tab ${tab === "upcoming" ? "is-on" : ""}`} onClick={() => setTab("upcoming")}>Próximos</button>
              <button type="button" className={`ar-tab ${tab === "results" ? "is-on" : ""}`} onClick={() => setTab("results")}>Resultados</button>
            </div>
          }
        >
          {matches.length ? matches.map((m) => <ArenaMatchLine key={m.id} match={m} />) : (
            <div className="ar-empty">Nada en esta categoría.</div>
          )}
        </ArenaPanel>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ar-gap-lg)" }}>
          {live.length > 0 && (
            <ArenaPanel title="En directo ahora" compact>
              {live.slice(0, 3).map((m) => (
                <Link key={m.id} href={`/matches/${m.id}`} className="ar-compact-row">
                  <span className="ar-live-dot" />
                  <div className="ar-compact-main">
                    <div className="ar-compact-title">{teamName(m.teamASlug)} vs {teamName(m.teamBSlug)}</div>
                    <div className="ar-compact-sub">{m.stage} · {m.format}</div>
                  </div>
                  <span className="ar-compact-stat" style={{ color: "var(--ar-live)" }}>{m.scoreA}–{m.scoreB}</span>
                </Link>
              ))}
            </ArenaPanel>
          )}

          <ArenaPanel title="Contexto torneos" href="/tournaments" linkLabel="Ver todos" compact>
            {featuredTournaments.map((t) => (
              <Link key={t.slug} href="/tournaments" className="ar-compact-row">
                <div className="ar-compact-main">
                  <div className="ar-compact-title">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
                  <div className="ar-compact-sub">{t.region} · {t.prizePool}</div>
                </div>
                <ArenaBadge variant={t.status === "live" ? "red" : "blue"}>{t.status === "live" ? "Live" : "Próximo"}</ArenaBadge>
              </Link>
            ))}
          </ArenaPanel>

          {nextMatch && (
            <ArenaPanel title="Próximo partido" href={`/matches/${nextMatch.id}`} linkLabel="Ver" compact>
              <div className="ar-panel-pad">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
                  <TeamLogo slug={nextMatch.teamASlug} name={teamName(nextMatch.teamASlug)} size={40} />
                  <span style={{ fontFamily: "var(--ar-head)", fontWeight: 800, color: "var(--ar-dim)" }}>VS</span>
                  <TeamLogo slug={nextMatch.teamBSlug} name={teamName(nextMatch.teamBSlug)} size={40} />
                </div>
                <div style={{ textAlign: "center", fontSize: 13, color: "var(--ar-muted)" }}>
                  {nextDate?.toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <ArenaBadge variant="dim">{nextMatch.format}</ArenaBadge>
                  <ArenaBadge variant="gold">{nextMatch.stage}</ArenaBadge>
                </div>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  {[nextMatch.teamASlug, nextMatch.teamBSlug].map((slug) => {
                    const team = getTeam(slug);
                    if (!team) return null;
                    const wins = team.form.filter((f) => f === "W").length;
                    return (
                      <div key={slug} style={{ padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--ar-line)", textAlign: "center" }}>
                        <div style={{ fontWeight: 700 }}>{team.tag}</div>
                        <div style={{ color: "var(--ar-dim)" }}>{wins}W / {team.form.length - wins}L</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ArenaPanel>
          )}
        </div>
      </div>
    </>
  );
}
