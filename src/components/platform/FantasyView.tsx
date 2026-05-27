"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Crown, Users, Wallet, ArrowLeftRight } from "lucide-react";
import { FormDots } from "@/components/platform/ui";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  FANTASY_BUDGET,
  FANTASY_SQUAD_SIZE,
  getSquadValue,
  getSquadEventTotal,
  getTournamentFantasyProfile,
  getUserSquad,
  getPlayerPrice,
  isPlayerInTournament,
  userSquadsByTournament,
  getTournamentMarket,
  getTournamentPlayerPool,
  getTournamentLeaderboard,
  type FantasySquadSlot,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { getFantasyMarketByTeam, getFantasyTournamentStats, hasFantasyForTournament } from "@/lib/data/fantasy-rosters";
import { getPlayer, getTeam, tournamentName, teamName, getFantasyRole, getPickRate } from "@/lib/data";
import { getTournament } from "@/lib/data/matches";

type SortKey = "price" | "rating" | "change" | "pick";

function cloneSquads() {
  const out: Record<string, FantasySquadSlot[]> = {};
  for (const [slug, squad] of Object.entries(userSquadsByTournament)) {
    const pool = new Set(getTournamentPlayerPool(slug));
    out[slug] = squad.filter((s) => pool.has(s.playerSlug)).map((s) => ({ ...s, eventPoints: SHOW_DEMO_SOCIAL ? s.eventPoints : 0 }));
  }
  return out;
}

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
  const tournaments = getFantasyTournaments(false);
  const validSlugs = tournaments.map((t) => t.slug);
  const initial = resolveTournamentParam(searchParams.get("tournament"), validSlugs) ?? DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initial);
  const [squads, setSquads] = useState(cloneSquads);
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>(SHOW_DEMO_SOCIAL ? "pick" : "price");

  const profile = getTournamentFantasyProfile(activeTournament);
  const squad = squads[activeTournament] ?? getUserSquad(activeTournament);
  const tourMeta = getTournament(activeTournament);
  const teamGroups = useMemo(() => getFantasyMarketByTeam(activeTournament), [activeTournament]);
  const market = useMemo(() => getTournamentMarket(activeTournament), [activeTournament]);
  const marketMap = useMemo(() => new Map(market.map((m) => [m.playerSlug, m])), [market]);
  const tournamentStats = useMemo(() => getFantasyTournamentStats(activeTournament), [activeTournament]);
  const leaderboard = useMemo(() => getTournamentLeaderboard(activeTournament).slice(0, 5), [activeTournament]);

  const spent = getSquadValue(squad, activeTournament);
  const budgetLeft = FANTASY_BUDGET - spent;
  const inSquad = squad.map((s) => s.playerSlug);
  const locked = profile.isLocked;
  const capPct = Math.round((spent / FANTASY_BUDGET) * 100);
  const transfersLeft = profile.transfersAllowed - profile.transfersUsed;
  const eventPts = SHOW_DEMO_SOCIAL ? getSquadEventTotal(squad) : null;

  const updateUrl = useCallback((t: string) => router.replace(`/fantasy?tournament=${t}`, { scroll: false }), [router]);

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
      const current = prev[activeTournament] ?? getUserSquad(activeTournament);
      const filtered = current.filter((s) => pool.has(s.playerSlug));
      if (filtered.length === current.length && prev[activeTournament]) return prev;
      return { ...prev, [activeTournament]: filtered };
    });
  }, [activeTournament]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamGroups
      .filter((g) => teamFilter === "all" || g.teamSlug === teamFilter)
      .map((g) => {
        let players = g.players.filter((slug) => {
          const p = getPlayer(slug);
          const team = getTeam(g.teamSlug);
          if (!p) return false;
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
  }, [teamGroups, teamFilter, query, sortBy, marketMap, activeTournament]);

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
  const sortOptions: SortKey[] = SHOW_DEMO_SOCIAL ? ["pick", "price", "rating", "change"] : ["price", "rating", "change"];

  return (
    <div className="bf-fantasy bf-fantasy-premium">
      <header className="bf-fantasy-gate">
        <div className="bf-fantasy-gate-left">
          <span className="bf-home-gate-badge">Fantasy</span>
          <div>
            <h1 className="bf-fantasy-title">Manager Mode</h1>
            <p className="bf-fantasy-sub">
              {FANTASY_SQUAD_SIZE} pros · ${FANTASY_BUDGET}M presupuesto · Capitán ×2
            </p>
          </div>
        </div>
        <div className="bf-fantasy-gate-actions">
          <Link href="/" className="bp-btn bp-btn-ghost">Inicio</Link>
          <Link href="/predictions" className="bp-btn bp-btn-red">Predicciones</Link>
        </div>
      </header>

      <div className="bf-fantasy-events">
        {tournaments.map(({ slug, tournament, teamCount, playerCount }) => {
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
                <span>{teamCount} equipos · {playerCount} jugadores</span>
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
            <strong>{SHOW_DEMO_SOCIAL ? (profile.totalPoints || "—") : "Próximamente"}</strong>
          </div>
        </div>
        <div className="bf-fantasy-stat">
          <div>
            <span>Ranking</span>
            <strong>{SHOW_DEMO_SOCIAL && profile.rank ? `#${profile.rank.toLocaleString()}` : "—"}</strong>
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
                      {eventPts != null && slot.eventPoints > 0 && ` · ${slot.eventPoints} pts`}
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

          {eventPts != null && (
            <div className="bf-fantasy-roster-total">
              <span>Total torneo</span>
              <strong>{eventPts} pts</strong>
            </div>
          )}

          {!SHOW_DEMO_SOCIAL && (
            <div className="bf-fantasy-soon">
              <span className="bf-home-eyebrow">Próximamente</span>
              <p>Puntuación en vivo, rankings y ligas cuando conectemos datos reales del circuito.</p>
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
            <span className="bp-chip bp-chip-gold">Pool real</span>
            <span>{tournamentStats.teamCount} equipos · {tournamentStats.playerCount} jugadores del torneo</span>
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
                    <TeamLogo slug={g.teamSlug} name={team.name} size={36} />
                    <div>
                      <strong>{team.tag}</strong>
                      <span>{team.name}</span>
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
                          size="md"
                          price={price}
                          priceChange={mp?.priceChange}
                          pickRate={SHOW_DEMO_SOCIAL ? getPickRate(slug) : undefined}
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

          {SHOW_DEMO_SOCIAL && leaderboard.length > 0 ? (
            <div className="bf-fantasy-aside-card">
              <span className="bf-home-eyebrow">Top managers</span>
              {leaderboard.map((e) => (
                <div key={e.rank} className="bf-fantasy-rank-row">
                  <span className={e.rank <= 3 ? "gold" : ""}>#{e.rank}</span>
                  <div>
                    <strong>{e.username}</strong>
                    <span>Cap. {e.captainIgn}</span>
                  </div>
                  <strong className="gold">{e.points}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="bf-fantasy-aside-card is-muted">
              <span className="bf-home-eyebrow">Clasificación</span>
              <p>Los rankings globales y por torneo estarán disponibles cuando lancemos la temporada con datos en vivo.</p>
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
