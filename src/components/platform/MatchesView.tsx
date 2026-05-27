"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MatchLine, FeaturedMatch } from "@/components/platform/ui";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import {
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  getCuratedHomeMatches,
  isKnownTeamSlug,
  openPredictions,
  teamName,
  getTierBPlusTournaments,
} from "@/lib/data";
import { getMatchEnrichment } from "@/lib/data/match-meta";

function cleanName(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function MatchesView() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "upcoming");
  const tierTours = useMemo(() => getTierBPlusTournaments(10), []);
  const hotVote = openPredictions.find((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug));

  const list = useMemo(() => getCuratedHomeMatches(tab, 12), [tab]);
  const spotlight = list[0] ?? null;
  const listRest = spotlight ? list.slice(1) : list;

  const upsets = useMemo(
    () =>
      getRecentMatches(30)
        .filter((m) => isKnownTeamSlug(m.teamASlug) && m.status === "finished")
        .filter((m) => {
          const enrich = getMatchEnrichment(m);
          const winnerIsA = m.scoreA > m.scoreB;
          const communityFavA = enrich.communityPickA >= 50;
          return winnerIsA !== communityFavA;
        })
        .slice(0, 4),
    [],
  );

  return (
    <div className="bf-matches-page">
      <header className="bf-fantasy-gate">
        <div className="bf-fantasy-gate-left">
          <span className="bf-home-gate-badge">Calendario</span>
          <div>
            <h1 className="bf-fantasy-title">Partidos</h1>
            <p className="bf-fantasy-sub">
              {live.length > 0 && (
                <span className="bf-matches-live-pill">
                  <span className="bp-live-dot" /> {live.length} en directo
                </span>
              )}
              {" "}Datos Liquipedia · equipos con logo PNG
            </p>
          </div>
        </div>
        <Link href="/predictions" className="bp-btn bp-btn-red">Votar</Link>
      </header>

      {(spotlight || tab !== "results") && spotlight && (
        <FeaturedMatch match={spotlight} tag={spotlight.status === "live" ? "EN DIRECTO" : "Destacado"} />
      )}

      {hotVote && tab !== "results" && (
        <div className="bf-matches-vote">
          <InteractiveVoteCard event={hotVote} />
        </div>
      )}

      <div className="bf-home-tabs">
        {(["live", "upcoming", "results"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`bf-home-tab ${tab === t ? "is-on" : ""} ${t === "live" && live.length ? "has-live" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "live" ? `Directo (${live.length})` : t === "upcoming" ? "Próximos" : "Resultados"}
          </button>
        ))}
      </div>

      <div className="bf-matches-layout">
        <section className="bf-matches-feed">
          {listRest.length > 0 ? (
            listRest.map((m) => <MatchLine key={m.id} match={m} rich />)
          ) : !spotlight ? (
            <p className="bf-home-empty">Sin partidos en esta pestaña.</p>
          ) : null}

          {upsets.length > 0 && tab === "results" && (
            <div className="bf-matches-upsets">
              <span className="bf-home-eyebrow">Upsets</span>
              {upsets.map((m) => (
                <Link key={m.id} href={`/matches/${m.id}`} className="bf-matches-upset-row">
                  <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size={32} />
                  <span className="bf-matches-score">{m.scoreA} – {m.scoreB}</span>
                  <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size={32} />
                  <span className="bp-chip bp-chip-gold">Upset</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="bf-fantasy-aside">
          <div className="bf-fantasy-aside-card">
            <span className="bf-home-eyebrow">Torneos activos</span>
            {tierTours.slice(0, 8).map((t) => (
              <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-matches-tour-row">
                <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={36} />
                <div>
                  <strong>{cleanName(t.shortName)}</strong>
                  <span>{t.prizePool}</span>
                </div>
                {t.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                )}
              </Link>
            ))}
            <Link href="/tournaments" className="bf-home-link">Todos los torneos</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
