"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";
import { predictChronologySort } from "@/lib/data/predictions-filters";
import { buildAllPlayoffBrackets, enrichPrediction } from "@/lib/data/predictions-ui";
import Link from "next/link";
import { FeaturedMatch } from "@/components/platform/ui";
import { MatchCountdown } from "@/components/platform/MatchCountdown";
import { PlayerCardMini } from "@/components/platform/PlayerCard";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { PredictionsQuickVoteSection } from "@/components/platform/predictions/PredictionsQuickVoteSection";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  CATALOG_STATS,
  catalogSyncedAt,
  getBsc2026CircuitTeamSlugs,
  tierBadgeClass,
  tierLabel,
  tournamentName,
} from "@/lib/data";
import { useCatalog } from "@/contexts/CatalogContext";
import { useMergedCircuitTeams, useCatalogTeamCount, usePublicCircuitTeams } from "@/hooks/useMergedCatalog";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  FANTASY_BUDGET,
  getCuratedHomeMatches,
  getLiveMatches,
  getSquadValue,
  getUserSquadDisplay,
  getMatch,
  getUpcomingMatches,
  getRecentMatches,
  getTournamentFantasyProfile,
  getTournamentPlayerPool,
  getPlayer,
  getTopActivePlayers,
  isKnownTeamSlug,
  isPickemMatchEligible,
  teamName,
  teams,
} from "@/lib/data";
import { isPickemMatchOpen } from "@/lib/data/match-effective-status";
import { NewsCover } from "@/components/news/NewsCover";
import { getHomeTournaments } from "@/lib/data/home-tournaments";
import { hasTeamLogoSource } from "@/lib/data/png-logo-urls";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
import { useLatestNewsMerged } from "@/hooks/useMergedNews";
import { HomeSiteHeader } from "@/components/platform/HomeSiteHeader";

type MatchTab = "live" | "upcoming" | "results";

const BSC_CLUBS = [
  "sk-gaming",
  "team-heretics",
  "hmble",
  "fut-esports",
  "natus-vincere",
  "totem-esports",
  "big",
  "crazy-raccoon",
  "zeta-division",
  "reject",
  "skcalalas-ea",
  "tribe-gaming",
  "kds-esports",
  "loud",
  "skcalalas",
  "new-heights-gaming",
  "kaioperro",
  "only-realm",
  "bounty-hunters-esports",
];

function cleanName(raw: string): string {
  return raw.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function HomeView() {
  const logoConfig = useLogoConfig();
  const { aggregates, game } = useGame();
  const mergedTeams = useMergedCircuitTeams(teams);
  const circuitTeamCount = useCatalogTeamCount();
  const { complete: completeClubs } = usePublicCircuitTeams(teams);
  const [matchTab, setMatchTab] = useState<MatchTab>("results");

  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const squad = getUserSquadDisplay(DEFAULT_FANTASY_TOURNAMENT);
  const budgetLeft = FANTASY_BUDGET - getSquadValue(squad, DEFAULT_FANTASY_TOURNAMENT);
  const fantasyProfile = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const topPros = useMemo(() => {
    const pool = new Set(getTournamentPlayerPool(DEFAULT_FANTASY_TOURNAMENT));
    return getTopActivePlayers(48)
      .filter((p) => p.teamSlug && pool.has(p.slug))
      .slice(0, 3);
  }, []);

  const homeClubs = useMemo(() => {
    const bySlug = new Map(completeClubs.map((t) => [t.slug, t]));
    const ordered: typeof teams = [];
    const priority = [...BSC_CLUBS, ...getBsc2026CircuitTeamSlugs(), ...mergedTeams.map((t) => t.slug)];
    const seen = new Set<string>();
    for (const slug of priority) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      const t = bySlug.get(slug);
      if (t && hasTeamLogoSource(slug, logoConfig)) ordered.push(t);
    }
    for (const t of completeClubs) {
      if (!seen.has(t.slug) && hasTeamLogoSource(t.slug, logoConfig)) {
        seen.add(t.slug);
        ordered.push(t);
      }
    }
    return ordered;
  }, [logoConfig, completeClubs, mergedTeams]);

  const marqueeClubs = useMemo(() => [...homeClubs, ...homeClubs], [homeClubs]);
  const homeTournaments = useMemo(() => getHomeTournaments(), []);
  const matchPool = useMemo(() => getCuratedHomeMatches(matchTab, 6), [matchTab]);
  const topNews = useLatestNewsMerged(3);
  const voteEvents = useMemo(() => {
    const { open } = buildPredictionEvents(aggregates, game?.votes ?? {});
    const votes = game?.votes ?? {};
    return open
      .filter((e) => {
        const m = getMatch(e.matchId);
        if (m) return isPickemMatchEligible(m) && isPickemMatchOpen(m);
        return isPickemMatchEligible({
          id: e.matchId,
          teamASlug: e.teamASlug,
          teamBSlug: e.teamBSlug,
          stage: e.stage,
          scoreA: 0,
          scoreB: 0,
          tournamentSlug: e.tournamentSlug,
          date: e.deadline,
          status: "upcoming",
          region: "GLOBAL",
          format: "Bo3",
        });
      })
      .map((e) => enrichPrediction(e, votes))
      .sort(predictChronologySort);
  }, [aggregates, game?.votes]);

  const homeVoteBrackets = useMemo(() => buildAllPlayoffBrackets(voteEvents), [voteEvents]);

  const spotlight =
    live[0] ?? getUpcomingMatches().find((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug)) ?? null;

  return (
    <div className="bf-home-ultra bf-page-ultra">
      <HomeSiteHeader />

      <section className="fu-hero fu-hero-live bf-home-hero" id="home-hero">
        <div className="fu-hero-orbs" aria-hidden>
          <span className="fu-orb fu-orb-1" />
          <span className="fu-orb fu-orb-2" />
          <span className="fu-orb fu-orb-3" />
        </div>
        <div className="fu-hero-bg" aria-hidden />
        <div className="fu-hero-mesh" aria-hidden />
        <div className="fu-hero-shine" aria-hidden />
        <div className="fu-hero-grid">
          <div>
            <p className="fu-kicker">
              <span className="bp-live-dot" /> Brawl Stars Championship · 2026
            </p>
            <h1 className="fu-title">
              Brawl<em>Forge</em>
            </h1>
            <p className="fu-lead">
              El hub del circuito BSC 2026: {circuitTeamCount} equipos, fantasy con plantilla real, predicciones
              en cada partido y perfiles de clubes y jugadores.
            </p>
            <div className="fu-cta-row">
              <Link href="/fantasy" className="fu-btn fu-btn-gold">
                Fantasy · ${budgetLeft.toFixed(1)}M libre
              </Link>
              <Link href="/predictions" className="fu-btn fu-btn-red">
                Predicciones
              </Link>
              <Link href="/matches" className="fu-btn fu-btn-ghost">
                Calendario
              </Link>
            </div>
            <div className="fu-stats">
              <div className="fu-stat">
                <b>{circuitTeamCount}</b>
                <span>Equipos 2026</span>
              </div>
              <div className="fu-stat">
                <b>{CATALOG_STATS.playersActive}</b>
                <span>Pros activos</span>
              </div>
              <div className="fu-stat">
                <b>{homeTournaments.length}</b>
                <span>Eventos BSC</span>
              </div>
              <div className="fu-stat">
                <b>{live.length || "—"}</b>
                <span>En directo</span>
              </div>
            </div>
          </div>

          <div className="fu-cards-showcase bf-home-cards-showcase" aria-hidden={false}>
            {topPros.map((p, i) => (
              <div key={p.slug} className={`fu-card-float fu-card-float-${i + 1} bf-home-hero-card`}>
                <PlayerCard
                  playerSlug={p.slug}
                  clubSlug={p.teamSlug}
                  size="lg"
                  animate={false}
                  href={`/players/${p.slug}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {spotlight && (
        <Link
          href={`/matches/${spotlight.id}`}
          className={`fu-spotlight bf-shine-hover ${spotlight.status === "live" ? "is-live" : ""}`}
        >
          <div className="fu-spotlight-head">
            <TournamentLogo slug={spotlight.tournamentSlug} name={tournamentName(spotlight.tournamentSlug)} size={44} />
            <div className="fu-spotlight-meta">
              <strong>{tournamentName(spotlight.tournamentSlug)}</strong>
              <span>{spotlight.stage}</span>
            </div>
            {spotlight.status === "live" ? (
              <span className="bp-chip bp-chip-live">LIVE</span>
            ) : (
              <MatchCountdown dateStr={spotlight.date} />
            )}
          </div>
          <div className="fu-spotlight-battle">
            <div className="fu-spotlight-team">
              <TeamLogo slug={spotlight.teamASlug} name={teamName(spotlight.teamASlug)} size={80} />
              <span>{teamName(spotlight.teamASlug)}</span>
            </div>
            <span className="fu-spotlight-vs">VS</span>
            <div className="fu-spotlight-team">
              <TeamLogo slug={spotlight.teamBSlug} name={teamName(spotlight.teamBSlug)} size={80} />
              <span>{teamName(spotlight.teamBSlug)}</span>
            </div>
          </div>
        </Link>
      )}

      <section className="fu-marquee-wrap">
        <div className="fu-marquee-head">
          <h2>{circuitTeamCount} clubes del circuito 2026</h2>
        </div>
        <div className="fu-marquee-track">
          {marqueeClubs.map((t, i) => (
            <Link key={`${t.slug}-${i}`} href={`/teams/${t.slug}`} className="fu-marquee-item" title={t.name}>
              <TeamLogo slug={t.slug} name={t.name} tag={t.tag} size={56} glow={false} priority />
              <span className="fu-marquee-tag">{t.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="fu-panel fu-panel-tournaments">
        <div className="fu-panel-head">
          <div className="fu-tours-title-row">
            <TournamentLogo slug="bsc-2026-brawl-cup" name="BSC" size={36} glow={false} />
            <div>
              <h2>Torneos BSC 2026</h2>
              <p className="fu-panel-sub">Logos oficiales · calendario completo</p>
            </div>
          </div>
          <Link href="/tournaments">Ver todos</Link>
        </div>
        <div className="fu-tours-scroll">
          {homeTournaments.map((t) => (
            <Link
              key={t.slug}
              href={`/tournaments/${t.slug}`}
              className={`fu-tour-chip bf-shine-hover ${t.status === "live" ? "fu-tour-chip--live" : ""}`}
            >
              <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={44} glow={false} />
              <div className="fu-tour-chip-text">
                {t.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`} style={{ marginBottom: 4, display: "inline-block" }}>
                    {tierLabel(t.tier)}
                  </span>
                )}
                <strong>{cleanName(t.shortName)}</strong>
                <span>
                  {t.prizePool} · {t.status === "live" ? "En directo" : t.status === "upcoming" ? "Próximo" : "Finalizado"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="fu-bento">
        <section className="fu-panel fu-panel-glow fu-bento-matches">
          <div className="fu-panel-head">
            <h2>Centro de partidos</h2>
            <Link href="/matches">Ver todo</Link>
          </div>
          <div className="fu-tabs">
            {(["live", "upcoming", "results"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`fu-tab ${matchTab === tab ? "is-on" : ""}`}
                onClick={() => setMatchTab(tab)}
              >
                {tab === "live" ? `Directo (${live.length})` : tab === "upcoming" ? "Próximos" : "Resultados"}
              </button>
            ))}
          </div>
          <div className="fu-match-stack">
            {matchPool.length > 0 ? (
              matchPool.map((m) => <FeaturedMatch key={m.id} match={m} tag={m.status === "live" ? "LIVE" : undefined} />)
            ) : (
              <p className="bf-home-empty">No hay partidos en esta pestaña.</p>
            )}
          </div>
        </section>

        <section className="fu-panel fu-panel-glow fu-panel-squad">
          <div className="fu-panel-head">
            <h2>Tu plantilla</h2>
            <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}>Gestionar</Link>
          </div>
          <p className="fu-panel-sub">{cleanName(tournamentName(DEFAULT_FANTASY_TOURNAMENT))}</p>
          <div className="fu-squad-strip">
            {squad.map((s) => (
              <PlayerCardMini
                key={s.playerSlug}
                playerSlug={s.playerSlug}
                clubSlug={getPlayer(s.playerSlug)?.teamSlug}
                isCaptain={s.isCaptain}
              />
            ))}
            {Array.from({ length: Math.max(0, 3 - squad.length) }).map((_, i) => (
              <Link
                key={i}
                href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}
                className="bf-card-mini bf-card-add"
              >
                <span className="bf-card-mini-avatar">+</span>
                <span className="bf-card-mini-name">Fichar</span>
              </Link>
            ))}
          </div>
          <div className="fu-squad-footer">
            <span className="fu-squad-pill">${budgetLeft.toFixed(1)}M disponible</span>
            <span className="fu-squad-deadline">
              Cierra {new Date(fantasyProfile.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
          </div>
        </section>

        {voteEvents.length > 0 && (
          <section className="fu-panel fu-panel-glow" style={{ gridColumn: "1 / -1" }}>
            <div className="fu-panel-head">
              <h2>Predicciones · comunidad</h2>
              <Link href="/predictions">Todas las predicciones</Link>
            </div>
            <div className="bf-predict-bsc bf-predict-bsc-home">
              <PredictionsQuickVoteSection
                events={voteEvents}
                votes={game?.votes ?? {}}
                brackets={homeVoteBrackets}
                title="Predicción rápida"
                hint="Todos los partidos abiertos — bracket 2×2 y grupos."
              />
            </div>
          </section>
        )}

        {topNews.length > 0 && (
          <section className="fu-panel fu-panel-glow fu-bento-news">
            <div className="fu-panel-head">
              <h2>Noticias del circuito</h2>
              <Link href="/news">Ver todas</Link>
            </div>
            <div className="fu-news-home-row">
              {topNews.map((a) => (
                <Link key={a.slug} href={`/news/${a.slug}`} className="fu-news-home-card bf-shine-hover">
                  <div className="fu-news-home-cover">
                    <NewsCover article={a} size="card" />
                  </div>
                  <span className={`bp-chip ${a.hot ? "bp-chip-break" : "bp-chip-gold"}`}>
                    {a.hot ? "Hot" : a.category}
                  </span>
                  <strong>{a.title}</strong>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--bp-dim)", marginTop: 4 }}>
        Circuito BSC 2026 · actualizado{" "}
        {catalogSyncedAt ? new Date(catalogSyncedAt).toLocaleDateString("es-ES") : "—"}
      </p>
    </div>
  );
}
