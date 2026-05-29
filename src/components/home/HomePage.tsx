import Link from "next/link";
import { Flame, Gamepad2, Sparkles, Trophy, Zap, ChevronRight, Radio } from "lucide-react";
import { FantasyCard } from "@/components/fantasy/FantasyCard";
import { PickTicket } from "@/components/predictions/PickTicket";
import { TournamentCard } from "@/components/brawl/TournamentCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { BrandMark } from "@/components/ui/BrandMark";
import {
  getTopFantasyPlayers,
  getUpcomingMatches,
  getLiveMatches,
  getPlayer,
  getBscCircuitTournaments,
  teams,
  players,
  teamName,
  tournamentName,
} from "@/lib/data";
import { openPredictions } from "@/lib/data/predictions";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getUserSquad,
  getPlayerPrice,
  getTournamentFantasyProfile,
  transferMarket,
} from "@/lib/data/fantasy";
import { CATALOG_STATS } from "@/lib/data/catalog";

export function HomePage() {
  const live = getLiveMatches();
  const upcoming = getUpcomingMatches();
  const topPros = getTopFantasyPlayers(6);
  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const fantasyProfile = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const heroSlugs =
    squad.length >= 3 ? squad.map((s) => s.playerSlug) : topPros.slice(0, 3).map((p) => p.slug);
  const featuredVotes = openPredictions.filter((p) => p.featured).slice(0, 2);
  const voteCards = featuredVotes.length ? featuredVotes : openPredictions.slice(0, 2);
  const liveTournaments = getBscCircuitTournaments()
    .filter((t) => t.status === "live" || t.status === "upcoming")
    .slice(0, 4);
  const marqueeTeams = teams.slice(0, 20);
  const matchRail = [...live, ...upcoming].slice(0, 8);

  return (
    <div className="forge-page bf-home">
      {/* ─── HERO ─── */}
      <section className="bf-home-hero">
        <div className="bf-home-hero-stripe" />
        <div className="bf-home-hero-accent" />
        <div className="bf-home-hero-inner">
          <div className="bf-home-hero-copy">
            <div className="bf-home-brand">
              <BrandMark size={44} />
              <div>
                <div className="bf-home-kicker">
                  <Radio className="h-3 w-3" />
                  {live.length > 0 ? `${live.length} live` : "BSC 2026"}
                </div>
                <h1 className="bf-home-title">
                  BRAWL<span className="bf-home-title-forge">FORGE</span>
                </h1>
              </div>
            </div>

            <p className="bf-home-sub">
              Fantasy con {CATALOG_STATS.players} pros · {CATALOG_STATS.teams} equipos ·{" "}
              {CATALOG_STATS.tournaments2026.toLocaleString("es-ES")} torneos. Ficha, vota y sigue el circuito.
            </p>

            <div className="bf-home-stats">
              {[
                { val: CATALOG_STATS.players, lbl: "Jugadores" },
                { val: CATALOG_STATS.teams, lbl: "Equipos" },
                { val: upcoming.length, lbl: "Partidos" },
                { val: openPredictions.length, lbl: "Votos" },
              ].map((s) => (
                <div key={s.lbl} className="bf-home-stat">
                  <div className="bf-home-stat-val">{s.val}</div>
                  <div className="bf-home-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            <div className="bf-home-cta">
              <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} className="bf-btn bf-btn-yellow">
                <Zap className="h-4 w-4" />
                Mi Arena
              </Link>
              <Link href="/predictions" className="bf-btn bf-btn-red">
                <Flame className="h-4 w-4" />
                Vota
              </Link>
              <Link href="/players" className="bf-btn bf-btn-outline">
                <Sparkles className="h-4 w-4" />
                Pros
              </Link>
            </div>
          </div>

          <div className="bf-home-hero-visual">
            <div className="bf-home-card-stack" aria-hidden={false}>
              {heroSlugs.map((slug, i) => {
                const mp = transferMarket.find((m) => m.playerSlug === slug);
                const isCaptain = squad.find((s) => s.playerSlug === slug)?.isCaptain ?? i === 1;
                return (
                  <div key={slug} className={`bf-home-card-slot bf-home-card-slot-${i + 1}`}>
                    <FantasyCard
                      playerSlug={slug}
                      variant="vault"
                      size={i === 1 ? "lg" : "md"}
                      isCaptain={isCaptain}
                      price={getPlayerPrice(slug)}
                      priceChange={mp?.priceChange ?? 0}
                      form={mp?.form}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGOS COMPACTOS ─── */}
      <div className="bf-home-marquee-wrap">
        <div className="bf-home-marquee">
          {marqueeTeams.map((t) => (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="bf-home-marquee-item" title={t.name}>
              <TeamLogo slug={t.slug} name={t.name} size={28} />
              <span className="bf-home-marquee-tag">{t.tag}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bf-home-body">
        {/* ─── PARTIDOS ─── */}
        <section className="bf-home-section">
          <div className="bf-home-section-head">
            <h2 className="bf-home-section-title">Centro de partidos</h2>
            <Link href="/matches" className="bf-home-link">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bf-home-grid">
            {matchRail.map((m) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className={`bf-home-panel forge-match-tile ${m.status === "live" ? "forge-match-tile-live" : ""}`}
              >
                <div className="bf-home-match-meta">
                  {m.status === "live" && <span className="bf-pulse" />}
                  {tournamentName(m.tournamentSlug)}
                </div>
                <div className="bf-home-match-row">
                  <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size={36} />
                  <span className="bf-home-match-score">
                    {m.status === "upcoming" ? (
                      "VS"
                    ) : (
                      <>
                        {m.scoreA}<span>:</span>{m.scoreB}
                      </>
                    )}
                  </span>
                  <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size={36} />
                </div>
                <div className="bf-home-match-names">
                  {teamName(m.teamASlug)} vs {teamName(m.teamBSlug)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── DASHBOARD GRID ─── */}
        <div className="bf-home-grid bf-home-grid-dashboard">
          <div className="bf-home-panel bf-home-panel-fantasy">
            <div className="bf-home-panel-head">
              <Gamepad2 className="h-5 w-5 text-[var(--bf-blue)]" />
              <span>Fantasy</span>
              {fantasyProfile.rank > 0 && (
                <span className="bf-home-panel-badge">#{fantasyProfile.rank.toLocaleString()}</span>
              )}
            </div>
            <div className="bf-home-fantasy-row">
              <TournamentLogo slug={DEFAULT_FANTASY_TOURNAMENT} name="BSC" size={40} />
              <div className="bf-home-fantasy-meta">
                <div className="font-bold">{tournamentName(DEFAULT_FANTASY_TOURNAMENT)}</div>
                <div className="text-xs text-[var(--bf-muted)]">{fantasyProfile.totalPoints} pts · tu roster</div>
              </div>
            </div>
            <div className="bf-home-roster">
              {heroSlugs.map((slug) => {
                const p = getPlayer(slug);
                const mp = transferMarket.find((m) => m.playerSlug === slug);
                if (!p) return null;
                return (
                  <Link
                    key={`roster-${slug}`}
                    href={`/players/${slug}`}
                    className="bf-home-roster-row"
                  >
                    <span className="bf-home-roster-ovr">{p.rating}</span>
                    <span className="bf-home-roster-name">{p.ign}</span>
                    <span className="bf-home-roster-team">{teamName(p.teamSlug)}</span>
                    <span className="bf-home-roster-price">${getPlayerPrice(slug)}</span>
                    {mp?.form && (
                      <span className="bf-home-roster-form">
                        {mp.form.slice(0, 3).map((f, i) => (
                          <span key={i} className={`ff-form-${f.toLowerCase()}`}>{f}</span>
                        ))}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} className="bf-btn bf-btn-yellow bf-home-panel-cta">
              Abrir arena
            </Link>
          </div>

          <div className="bf-home-panel bf-home-panel-vote">
            <div className="bf-home-panel-head">
              <Flame className="h-5 w-5 text-[var(--bf-red)]" />
              <span>Vota</span>
              <Link href="/predictions" className="bf-home-link ml-auto">
                {openPredictions.length} abiertos
              </Link>
            </div>
            <div className="bf-home-vote-grid">
              {voteCards.map((e) => (
                <PickTicket key={e.id} event={e} />
              ))}
            </div>
          </div>

          <div className="bf-home-panel bf-home-panel-pickem">
            <div className="bf-home-panel-head">
              <Trophy className="h-5 w-5 text-[var(--bf-yellow)]" />
              <span>Pick&apos;em</span>
            </div>
            <div className="bf-home-pickem-row">
              <TournamentLogo slug="world-finals-2026" name="WF" size={48} />
              <div>
                <div className="bf-display text-lg">World Finals 2026</div>
                <div className="text-xs text-[var(--bf-muted)]">Tokio · Bracket oficial</div>
              </div>
            </div>
            <div className="bf-home-pickem-bar">
              <div className="bf-home-pickem-fill" style={{ width: "38%" }} />
            </div>
            <Link href="/pickems" className="bf-btn bf-btn-yellow bf-home-panel-cta">
              Entrar al bracket
            </Link>
          </div>

          <div className="bf-home-panel bf-home-panel-tournaments">
            <div className="bf-home-panel-head">
              <span>Competiciones</span>
              <Link href="/tournaments" className="bf-home-link ml-auto">
                Todos →
              </Link>
            </div>
            <div className="bf-home-tournament-list">
              {liveTournaments.map((t) => (
                <TournamentCard key={t.slug} tournament={t} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── TOP PROS ─── */}
        <section className="bf-home-section">
          <div className="bf-home-section-head">
            <h2 className="bf-home-section-title">Top pros</h2>
            <Link href="/players" className="bf-home-link">
              Vault →
            </Link>
          </div>
          <div className="bf-home-grid bf-home-grid-pros">
            {topPros.map((p) => {
              const mp = transferMarket.find((m) => m.playerSlug === p.slug);
              return (
                <FantasyCard
                  key={p.slug}
                  playerSlug={p.slug}
                  variant="vault"
                  price={getPlayerPrice(p.slug)}
                  priceChange={mp?.priceChange ?? 0}
                  form={mp?.form}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
