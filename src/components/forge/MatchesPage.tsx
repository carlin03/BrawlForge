"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Block, MatchRow, StatStrip, Chip } from "./ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  getCuratedHomeMatches,
  getLiveMatches,
  getUpcomingMatches,
  getFeaturedTournaments,
  isKnownTeamSlug,
  teamName,
  getTeam,
  openPredictions,
  getPredictionLabel,
} from "@/lib/data";

export function ForgeMatches() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const upcoming = getUpcomingMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "upcoming");
  const matches = useMemo(() => getCuratedHomeMatches(tab, 40), [tab]);
  const featured = getFeaturedTournaments(5).filter((t) => t.status !== "finished");
  const next = upcoming[0];

  return (
    <>
      <h1 className="fg-h1">Partidos</h1>
      <p className="fg-lead">Calendario en vivo, resultados y contexto de torneo.</p>

      <StatStrip
        items={[
          { label: "En directo", value: String(live.length), accent: live.length ? "var(--fg-red)" : undefined },
          { label: "Próximos", value: String(upcoming.length) },
          { label: "Torneos", value: String(featured.length) },
        ]}
      />

      {live.length > 0 && (
        <div className="fg-live-bar">
          {live.map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="fg-live-pill is-live">
              <span className="fg-dot-live" />
              {teamName(m.teamASlug)} {m.scoreA}–{m.scoreB} {teamName(m.teamBSlug)}
            </Link>
          ))}
        </div>
      )}

      <div className="fg-matches-layout">
        <div>
          <div className="fg-tabs">
            {(["live", "upcoming", "results"] as const).map((t) => (
              <button key={t} type="button" className={`fg-tab ${tab === t ? "is-on" : ""}`} onClick={() => setTab(t)}>
                {t === "live" ? "Directo" : t === "upcoming" ? "Próximos" : "Resultados"}
              </button>
            ))}
          </div>
          <Block title="Calendario">
            {matches.length ? matches.map((m) => <MatchRow key={m.id} match={m} />) : (
              <div className="fg-empty">Sin partidos.</div>
            )}
          </Block>
        </div>

        <div style={{ display: "grid", gap: "var(--fg-gap-lg)" }}>
          {next && (
            <Block title="Próximo partido" href={`/matches/${next.id}`} linkLabel="Ver">
              <div style={{ padding: 16, textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12 }}>
                  <TeamLogo slug={next.teamASlug} name={teamName(next.teamASlug)} size={40} />
                  <span style={{ fontFamily: "var(--fg-head)", fontWeight: 700, color: "var(--fg-dim)" }}>VS</span>
                  <TeamLogo slug={next.teamBSlug} name={teamName(next.teamBSlug)} size={40} />
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                  {new Date(next.date).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                  <Chip>{next.format}</Chip>
                  <Chip variant="blue">{next.stage}</Chip>
                </div>
              </div>
            </Block>
          )}

          <Block title="Vota en vivo" href="/predictions">
            {openPredictions.filter((e) => isKnownTeamSlug(e.teamASlug)).slice(0, 4).map((e) => (
              <Link key={e.id} href="/predictions" className="fg-row">
                <div className="fg-row-main">
                  <div className="fg-row-title">{getPredictionLabel(e, "A")} vs {getPredictionLabel(e, "B")}</div>
                  <div className="fg-row-sub">{e.pickAPct}% · {e.pickBPct}%</div>
                </div>
                <Chip variant="gold">+{e.rewardPoints}</Chip>
              </Link>
            ))}
          </Block>

          <Block title="Torneos">
            {featured.map((t) => (
              <div key={t.slug} className="fg-row" style={{ cursor: "default" }}>
                <div className="fg-row-main">
                  <div className="fg-row-title">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
                  <div className="fg-row-sub">{t.region} · {t.prizePool}</div>
                </div>
                <Chip variant={t.status === "live" ? "live" : "blue"}>{t.status === "live" ? "Live" : "Próximo"}</Chip>
              </div>
            ))}
          </Block>
        </div>
      </div>
    </>
  );
}
