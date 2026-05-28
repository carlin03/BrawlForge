"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Crown, Users, Wallet, ArrowLeftRight } from "lucide-react";
import { FormDots } from "@/components/platform/ui";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  FANTASY_BUDGET,
  FANTASY_SQUAD_SIZE,
  getSquadValue,
  getTournamentFantasyProfile,
  getPlayerPrice,
  isPlayerInTournament,
  getTournamentMarket,
  getTournamentPlayerPool,
  type FantasySquadSlot,
} from "@/lib/data/fantasy";
import type { FantasyLeaderboardRow } from "@/lib/supabase/game-types";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useGame } from "@/contexts/GameContext";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { getFantasyMarketByTeam, getFantasyTournamentStats, hasFantasyForTournament } from "@/lib/data/fantasy-rosters";
import { getPlayer, getTeam, tournamentName, teamName, getFantasyRole, getPickRate } from "@/lib/data";
import { getTournament } from "@/lib/data/matches";
import type { Region } from "@/lib/types";
import { RegionBadge } from "@/components/ui/RegionBadge";

type SortKey = "price" | "rating" | "change" | "pick";

function resolveTournamentParam(param: string | null, validSlugs: string[]): string | null {
  if (!param) return null;
  if (validSlugs.includes(param)) return param;
  if (hasFantasyForTournament(param)) return param;
  return null;
}

function cleanName(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function FantasyView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, profile: authProfile } = useAuth();
  const { fromDb: catalogFromDb, syncedAt: catalogSyncedAt } = useCatalog();
  const { game, saveFantasy, ready: gameReady } = useGame();
  const tournaments = getFantasyTournaments(false);
  const validSlugs = tournaments.map((t) => t.slug);
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all");
  const visibleTournaments = useMemo(
    () =>
      tournaments.filter(
        (t) => regionFilter === "all" || t.tournament.region === regionFilter,
      ),
    [tournaments, regionFilter],
  );
  const initial = resolveTournamentParam(searchParams.get("tournament"), validSlugs) ?? DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initial);
  const [squads, setSquads] = useState<Record<string, FantasySquadSlot[]>>({});
  const [leaderboard, setLeaderboard] = useState<FantasyLeaderboardRow[]>([]);
  const [participants, setParticipants] = useState(0);
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [saveMsg, setSaveMsg] = useState("");

  const entry = game?.fantasy[activeTournament];
  const baseProfile = getTournamentFantasyProfile(activeTournament);
  const profile = {
    ...baseProfile,
    teamName: entry?.teamName ?? authProfile?.ign ?? baseProfile.teamName,
    totalPoints: entry?.totalPoints ?? 0,
    rank: game?.fantasyRank ?? 0,
    transfersUsed: entry?.transfersUsed ?? 0,
    participants,
  };
  const squad = squads[activeTournament] ?? entry?.squad.map((s) => ({
    playerSlug: s.playerSlug,
    isCaptain: s.isCaptain,
    eventPoints: s.eventPoints,
  })) ?? [];
  const tourMeta = getTournament(activeTournament);
  const teamGroups = useMemo(() => getFantasyMarketByTeam(activeTournament), [activeTournament]);
  const market = useMemo(() => getTournamentMarket(activeTournament), [activeTournament]);
  const marketMap = useMemo(() => new Map(market.map((m) => [m.playerSlug, m])), [market]);
  const tournamentStats = useMemo(() => getFantasyTournamentStats(activeTournament), [activeTournament]);

  const spent = getSquadValue(squad, activeTournament);
  const budgetLeft = FANTASY_BUDGET - spent;
  const inSquad = squad.map((s) => s.playerSlug);
  const locked = profile.isLocked;
  const capPct = Math.round((spent / FANTASY_BUDGET) * 100);
  const transfersLeft = profile.transfersAllowed - profile.transfersUsed;
  const updateUrl = useCallback((t: string) => router.replace(`/fantasy?tournament=${t}`, { scroll: false }), [router]);

  useEffect(() => {
    if (!game) return;
    setSquads((prev) => {
      const next = { ...prev };
      for (const [slug, e] of Object.entries(game.fantasy)) {
        next[slug] = e.squad.map((s) => ({
          playerSlug: s.playerSlug,
          isCaptain: s.isCaptain,
          eventPoints: s.eventPoints,
        }));
      }
      return next;
    });
  }, [game]);

  useEffect(() => {
    fetch(`/api/fantasy/leaderboard?tournament=${encodeURIComponent(activeTournament)}&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        setLeaderboard(d.leaderboard ?? []);
        setParticipants(d.participants ?? 0);
      })
      .catch(() => {
        setLeaderboard([]);
        setParticipants(0);
      });
  }, [activeTournament]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const current = squads[activeTournament];
    if (current === undefined) return;
    const timer = setTimeout(() => {
      void saveFantasy(activeTournament, profile.teamName, current).then((res) => {
        setSaveMsg(res.error ? res.error : "Plantilla guardada");
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [squads, activeTournament, isLoggedIn, profile.teamName, saveFantasy]);

  useEffect(() => {
    const p = searchParams.get("tournament");
    const resolved = resolveTournamentParam(p, validSlugs);
    if (resolved) setActiveTournament(resolved);
  }, [searchParams, validSlugs]);

  useEffect(() => {
    setTeamFilter("all");
    setQuery("");
    setSquads((prev) => {
      const pool = new Set(getTournamentPlayerPool(activeTournament));
      const current = prev[activeTournament] ?? squad;
      const filtered = current.filter((s) => pool.has(s.playerSlug));
      if (filtered.length === current.length && prev[activeTournament]) return prev;
      return { ...prev, [activeTournament]: filtered };
    });
  }, [activeTournament]);

  const poolSet = useMemo(
    () => new Set(getTournamentPlayerPool(activeTournament)),
    [activeTournament],
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamGroups
      .filter((g) => teamFilter === "all" || g.teamSlug === teamFilter)
      .map((g) => {
        let players = g.players.filter((slug) => {
          const p = getPlayer(slug);
          const team = getTeam(g.teamSlug);
          if (!p || !poolSet.has(slug)) return false;
          if (!q) return true;
          return p.ign.toLowerCase().includes(q) || team?.name.toLowerCase().includes(q);
        });
        players = [...players].sort((a, b) => {
          const pa = getPlayer(a);
          const pb = getPlayer(b);
          const ma = marketMap.get(a);
          const mb = marketMap.get(b);
          if (sortBy === "price") return getPlayerPrice(b, activeTournament) - getPlayerPrice(a, activeTournament);
          if (sortBy === "rating") return (pb?.rating ?? 0) - (pa?.rating ?? 0);
          if (sortBy === "change") return (mb?.priceChange ?? 0) - (ma?.priceChange ?? 0);
          return (pb?.fantasyPoints ?? 0) - (pa?.fantasyPoints ?? 0);
        });
        return { ...g, players };
      })
      .filter((g) => g.players.length > 0);
  }, [teamGroups, teamFilter, query, sortBy, marketMap, activeTournament, poolSet]);

  function pick(slug: string) {
    if (locked || squad.length >= FANTASY_SQUAD_SIZE || inSquad.includes(slug)) return;
    if (!isPlayerInTournament(slug, activeTournament)) return;
    const price = getPlayerPrice(slug, activeTournament);
    if (price > budgetLeft) return;
    setSquads((prev) => ({
      ...prev,
      [activeTournament]: [...squad, { playerSlug: slug, isCaptain: squad.length === 0, eventPoints: 0 }],
    }));
  }

  function remove(slug: string) {
    if (locked) return;
    let next = squad.filter((s) => s.playerSlug !== slug);
    if (next.length && !next.some((s) => s.isCaptain)) {
      next = [{ ...next[0], isCaptain: true }, ...next.slice(1)];
    }
    setSquads((prev) => ({ ...prev, [activeTournament]: next }));
  }

  function setCaptain(slug: string) {
    if (locked) return;
    setSquads((prev) => ({
      ...prev,
      [activeTournament]: squad.map((s) => ({ ...s, isCaptain: s.playerSlug === slug })),
    }));
  }

  const slots = Array.from({ length: FANTASY_SQUAD_SIZE }, (_, i) => squad[i] ?? null);
  const sortOptions: SortKey[] = ["price", "rating", "change", "pick"];

  if (!gameReady) {
    return <div className="bf-auth-page">Cargando fantasy…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="bf-auth-page">
        <div className="bf-auth-card">
          <h1>Fantasy BrawlForge</h1>
          <p className="bf-auth-lead">Inicia sesión para crear tu plantilla y guardarla en tu cuenta.</p>
          <Link href="/login?next=/fantasy" className="bp-btn bp-btn-gold">
            Entrar
          </Link>
          <Link href="/registro" className="bp-btn bp-btn-ghost" style={{ marginLeft: 8 }}>
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bf-fantasy bf-fantasy-premium bf-fantasy-page bf-page-ultra">
      <PageUltraHero
        kicker={<span className="bp-chip bp-chip-gold">Fantasy BSC</span>}
        title={
          <>
            Manager <em>Mode</em>
          </>
        }
        lead={`${FANTASY_SQUAD_SIZE} pros · $${FANTASY_BUDGET}M presupuesto · Capitán ×2 puntos`}
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="fu-stat">
              <b>{tournamentStats.playerCount}</b>
              <span>En pool</span>
            </div>
            <div className="fu-stat">
              <b>{tournamentStats.teamCount}</b>
              <span>Clubes</span>
            </div>
            <div className="fu-stat">
              <b>${budgetLeft.toFixed(1)}M</b>
              <span>Libre</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href="/" className="fu-btn fu-btn-ghost">
              Inicio
            </Link>
            <Link href="/predictions" className="fu-btn fu-btn-red">
              Predicciones
            </Link>
            <Link href="/rankings" className="fu-btn fu-btn-gold">
              Rankings
            </Link>
          </>
        }
      />

      <div className="bf-home-tabs" style={{ marginBottom: 12 }}>
        {(["all", "GLOBAL", "EMEA", "EA", "NA", "SA"] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={`bf-home-tab ${regionFilter === r ? "is-on" : ""}`}
            onClick={() => setRegionFilter(r)}
          >
            {r === "all" ? "Todos" : r}
          </button>
        ))}
      </div>

      <p className="bf-fantasy-pool-banner">
        Pool del torneo: <strong>{tournamentStats.playerCount} jugadores</strong> de{" "}
        <strong>{tournamentStats.teamCount} equipos</strong> · Mercado separado por club
        {tourMeta?.region && (
          <>
            {" "}
            · <RegionBadge region={tourMeta.region} />
          </>
        )}
      </p>

      <div className="bf-fantasy-events">
        {visibleTournaments.map(({ slug, tournament, teamCount, playerCount }) => {
          const on = activeTournament === slug;
          const name = cleanName(tournament.shortName);
          return (
            <button
              key={slug}
              type="button"
              className={`bf-fantasy-event ${on ? "is-on" : ""}`}
              onClick={() => { setActiveTournament(slug); updateUrl(slug); }}
            >
              <TournamentLogo slug={slug} name={name} size={40} />
              <div className="bf-fantasy-event-body">
                {tournament.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(tournament.tier)}`}>{tierLabel(tournament.tier)}</span>
                )}
                <strong>{name}</strong>
                <span>
                  <RegionBadge region={tournament.region} /> {teamCount} equipos · {playerCount} jugadores
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bf-fantasy-stats">
        <div className="bf-fantasy-stat">
          <Wallet size={16} />
          <div>
            <span>Libre</span>
            <strong>${budgetLeft.toFixed(1)}M</strong>
          </div>
        </div>
        <div className="bf-fantasy-stat">
          <Users size={16} />
          <div>
            <span>Plantilla</span>
            <strong>{squad.length}/{FANTASY_SQUAD_SIZE}</strong>
          </div>
        </div>
        <div className="bf-fantasy-stat">
          <ArrowLeftRight size={16} />
          <div>
            <span>Fichajes</span>
            <strong>{transfersLeft}</strong>
          </div>
        </div>
        <div className="bf-fantasy-stat">
          <Crown size={16} />
          <div>
            <span>Puntos</span>
            <strong>{profile.totalPoints || 0}</strong>
          </div>
        </div>
        <div className="bf-fantasy-stat">
          <div>
            <span>Ranking</span>
            <strong>{profile.rank ? `#${profile.rank.toLocaleString()}` : "—"}</strong>
          </div>
        </div>
        <div className="bf-fantasy-stat wide">
          <div className="bp-budget-bar" style={{ width: "100%" }}>
            <div className="bp-budget-fill" style={{ width: `${capPct}%` }} />
          </div>
          <span className="bf-fantasy-budget-label">${spent.toFixed(1)}M / ${FANTASY_BUDGET}M{locked ? " · Cerrado" : ""}</span>
        </div>
      </div>

      <div className="bf-fantasy-layout">
        <aside className="bf-fantasy-roster">
          <div className="bf-fantasy-roster-head">
            <span className="bf-home-eyebrow">{tournamentName(activeTournament)}</span>
            <strong>{profile.teamName}</strong>
            {tourMeta?.prizePool && <span className="bf-fantasy-roster-prize">{tourMeta.prizePool}</span>}
          </div>

          <div className="bf-fantasy-roster-slots">
            {slots.map((slot, i) => {
              if (!slot) {
                return (
                  <div key={i} className="bf-fantasy-slot empty">
                    <span className="bf-fantasy-slot-num">{i + 1}</span>
                    <span className="bf-fantasy-slot-empty">Elige del mercado</span>
                  </div>
                );
              }
              const p = getPlayer(slot.playerSlug);
              const mp = marketMap.get(slot.playerSlug);
              if (!p?.teamSlug) return <div key={i} className="bf-fantasy-slot empty" />;
              return (
                <div key={slot.playerSlug} className={`bf-fantasy-slot ${slot.isCaptain ? "is-captain" : ""}`}>
                  <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={40} />
                  <div className="bf-fantasy-slot-info">
                    <div className="bf-fantasy-slot-name">
                      {p.ign}
                      {slot.isCaptain && <span className="bp-cap-badge">C</span>}
                    </div>
                    <div className="bf-fantasy-slot-meta">
                      {getFantasyRole(p.slug)} · {getPlayerPrice(p.slug, activeTournament)}M
                      {slot.eventPoints > 0 && ` · ${slot.eventPoints} pts`}
                    </div>
                    {mp?.form && <FormDots form={mp.form} />}
                  </div>
                  {!locked && (
                    <div className="bf-fantasy-slot-actions">
                      {!slot.isCaptain && (
                        <button type="button" className="bp-btn bp-btn-ghost bp-btn-sm" onClick={() => setCaptain(slot.playerSlug)} title="Capitán">C</button>
                      )}
                      <button type="button" className="bp-btn bp-btn-ghost bp-btn-sm" onClick={() => remove(slot.playerSlug)} title="Quitar">×</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {profile.totalPoints > 0 && (
            <div className="bf-fantasy-roster-total">
              <span>Total torneo</span>
              <strong>{profile.totalPoints} pts</strong>
            </div>
          )}
        </aside>

        <div className="bf-fantasy-market">
          <div className="bf-fantasy-market-toolbar">
            <div className="bf-fantasy-search">
              <Search size={15} />
              <input
                className="bp-input"
                placeholder="Buscar pro o club..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className="bf-fantasy-search-clear" onClick={() => setQuery("")} aria-label="Limpiar">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="bf-home-tabs">
              {sortOptions.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`bf-home-tab ${sortBy === k ? "is-on" : ""}`}
                  onClick={() => setSortBy(k)}
                >
                  {k === "pick" ? "Propiedad" : k === "price" ? "Precio" : k === "rating" ? "Rating" : "Δ precio"}
                </button>
              ))}
            </div>
          </div>

          <div className="bf-fantasy-filters">
            <button type="button" className={`bp-filter ${teamFilter === "all" ? "is-on" : ""}`} onClick={() => setTeamFilter("all")}>
              Todos
            </button>
            {teamGroups.map((g) => {
              const team = getTeam(g.teamSlug);
              if (!team) return null;
              return (
                <button
                  key={g.teamSlug}
                  type="button"
                  className={`bp-filter ${teamFilter === g.teamSlug ? "is-on" : ""}`}
                  onClick={() => setTeamFilter(g.teamSlug)}
                >
                  <TeamLogo slug={g.teamSlug} name={team.name} size={18} />
                  {team.tag}
                </button>
              );
            })}
          </div>

          <div className="bf-fantasy-pool-meta">
            {catalogFromDb && <span className="bp-chip bp-chip-gold">Catálogo en vivo</span>}
            <span>
              {tournamentStats.teamCount} equipos · {tournamentStats.playerCount} jugadores
              {catalogFromDb && catalogSyncedAt
                ? ` · sync ${new Date(catalogSyncedAt).toLocaleDateString("es")}`
                : ""}
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <p className="bf-home-empty">No hay jugadores con ese filtro.</p>
          ) : (
            filteredGroups.map((g) => {
              const team = getTeam(g.teamSlug);
              if (!team) return null;
              return (
                <section key={g.teamSlug} className="bf-fantasy-team-block">
                  <div className="bf-fantasy-team-head">
                    <TeamLogo slug={g.teamSlug} name={team.name} size={44} />
                    <div className="bf-fantasy-team-head-meta">
                      <strong>{team.tag}</strong>
                      <span>{team.name}</span>
                      <div className="bf-fantasy-team-head-stats">
                        <div className="bf-fantasy-stat-chip">
                          <RegionBadge region={team.region} />
                          <span className="bf-fantasy-stat-val">#{team.rank || "—"}</span>
                        </div>
                        <div className="bf-fantasy-stat-chip">
                          <span className="bf-fantasy-stat-label">Plantilla</span>
                          <strong>{g.players.length}</strong>
                        </div>
                        {team.earnings > 0 && (
                          <div className="bf-fantasy-stat-chip">
                            <span className="bf-fantasy-stat-label">Premios</span>
                            <strong>${(team.earnings / 1000).toFixed(0)}K</strong>
                          </div>
                        )}
                        {team.country && (
                          <div className="bf-fantasy-stat-chip">
                            <span className="bf-fantasy-stat-label">País</span>
                            <strong>{team.country}</strong>
                          </div>
                        )}
                        {team.form?.length > 0 && (
                          <div className="bf-fantasy-stat-chip bf-fantasy-stat-chip-wide">
                            <span className="bf-fantasy-stat-label">Forma</span>
                            <FormDots form={team.form} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bf-market-grid">
                    {g.players.map((slug) => {
                      const mp = marketMap.get(slug);
                      const price = getPlayerPrice(slug, activeTournament);
                      const already = inSquad.includes(slug);
                      const canPick = !locked && !already && squad.length < FANTASY_SQUAD_SIZE && price <= budgetLeft;
                      return (
                        <PlayerCard
                          key={slug}
                          playerSlug={slug}
                          clubSlug={g.teamSlug}
                          size="md"
                          animate={false}
                          showExtended
                          price={price}
                          priceChange={mp?.priceChange}
                          pickRate={getPickRate(slug)}
                          onAction={() => pick(slug)}
                          actionLabel={already ? "✓" : "+"}
                          actionDisabled={!canPick || already}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <aside className="bf-fantasy-aside">
          <div className="bf-fantasy-aside-card">
            <span className="bf-home-eyebrow">Torneo</span>
            <strong>{cleanName(tournamentName(activeTournament))}</strong>
            {tourMeta && (
              <ul className="bf-fantasy-aside-list">
                {tourMeta.tier != null && <li><span>Tier</span>{tierLabel(tourMeta.tier)}</li>}
                <li><span>Región</span>{tourMeta.region}</li>
                <li><span>Prize</span>{tourMeta.prizePool}</li>
                <li><span>Estado</span>{tourMeta.status === "live" ? "En directo" : tourMeta.status === "upcoming" ? "Próximo" : "Finalizado"}</li>
              </ul>
            )}
            <Link href={`/tournaments/${activeTournament}`} className="bf-home-link">Ver torneo</Link>
          </div>

          {saveMsg && (
            <div className="bf-fantasy-aside-card">
              <span className="bf-home-eyebrow">Estado</span>
              <p>{saveMsg}</p>
            </div>
          )}

          {leaderboard.length > 0 ? (
            <div className="bf-fantasy-aside-card">
              <span className="bf-home-eyebrow">Ranking real · {participants} managers</span>
              {leaderboard.slice(0, 8).map((e) => (
                <div key={e.user_id} className="bf-fantasy-rank-row">
                  <span className={e.rank <= 3 ? "gold" : ""}>#{e.rank}</span>
                  <div>
                    <strong>{e.team_name || e.display_name}</strong>
                    <span>{e.ign}</span>
                  </div>
                  <strong className="gold">{e.total_points}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="bf-fantasy-aside-card is-muted">
              <span className="bf-home-eyebrow">Clasificación</span>
              <p>Sé el primero en guardar plantilla para aparecer en el ranking.</p>
            </div>
          )}

          <div className="bf-fantasy-aside-card">
            <span className="bf-home-eyebrow">Reglas</span>
            <ul className="bf-fantasy-rules">
              <li>Elige {FANTASY_SQUAD_SIZE} jugadores del pool del torneo</li>
              <li>Presupuesto ${FANTASY_BUDGET}M — capitán puntúa ×2</li>
              <li>{profile.transfersAllowed} fichajes por ventana</li>
              <li>Solo pros activos del circuito Tier B+</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
