"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
import { SectionTabsBar } from "@/components/platform/SectionTabsBar";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import {
  CATALOG_STATS,
  getActivePlayers,
  getPlayerPrice,
  getPlayersByTeam,
  players,
  resolvePlayerRegion,
  searchPlayers,
  teamName,
} from "@/lib/data";
import {
  usePublicPlayersList,
  useMergedCircuitTeams,
  PLAYER_UNASSIGNED_LABEL,
} from "@/hooks/useMergedCatalog";
import { useCatalog } from "@/contexts/CatalogContext";
import { teams as staticTeams } from "@/lib/data";
import { getTeam } from "@/lib/data";
import { getBsc2026TeamRegion } from "@/lib/data/bsc-2026-team-regions";
import { getFantasyRole } from "@/lib/data/fantasy-meta";
import type { Region } from "@/lib/types";
import type { EsportsPlayer, PlayerStatus } from "@/lib/data/players";

type SortKey = "index" | "fantasy" | "price" | "name";
type StatusFilter = "all" | PlayerStatus;

const REGIONS: (Region | "all")[] = ["all", "EMEA", "NA", "SA", "EA"];

function statusLabel(s: PlayerStatus) {
  if (s === "active") return "Activo";
  if (s === "inactive") return "Inactivo";
  return "Retirado";
}

export function PlayersView() {
  const publicPlayers = usePublicPlayersList();
  const mergedTeams = useMergedCircuitTeams(staticTeams);
  const { teamsBySlug } = useCatalog();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Region | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("fantasy");

  const teamsForFilter = useMemo(() => {
    const slugSet = new Set<string>();
    for (const t of mergedTeams) {
      if (region !== "all" && t.region !== region) continue;
      slugSet.add(t.slug);
    }
    return [...slugSet]
      .map((slug) => ({
        slug,
        name: teamName(slug),
        count: getPlayersByTeam(slug).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [region, mergedTeams]);

  const list = useMemo(() => {
    let base = query.trim() ? searchPlayers(query, 200) : publicPlayers;
    base = base.filter((p) => !p.teamSlug || !!getTeam(p.teamSlug));
    if (status !== "all") base = base.filter((p) => p.status === status);
    if (region !== "all") base = base.filter((p) => resolvePlayerRegion(p.teamSlug, p.region) === region);
    if (teamFilter !== "all") base = base.filter((p) => p.teamSlug === teamFilter);

    return [...base].sort((a, b) => {
      if (sortBy === "fantasy") return b.fantasyPoints - a.fantasyPoints;
      if (sortBy === "price") return getPlayerPrice(b.slug) - getPlayerPrice(a.slug);
      if (sortBy === "name") return a.ign.localeCompare(b.ign);
      return b.rating - a.rating;
    });
  }, [query, region, status, teamFilter, sortBy, publicPlayers]);

  const stats = useMemo(
    () => ({
      total: players.length,
      active: getActivePlayers().length,
      withTeam: publicPlayers.filter((p) => p.teamSlug).length,
      unassigned: publicPlayers.filter((p) => !p.teamSlug).length,
    }),
    [publicPlayers],
  );

  const topPros = list.slice(0, 3);

  return (
    <PageUltraShell className="bf-players-page">
      <PageUltraHero
        kicker={
          <>
            <Users size={14} /> Pro circuit
          </>
        }
        title={
          <>
            Jugadores <em>elite</em>
          </>
        }
        lead={`${stats.withTeam} con equipo${stats.unassigned ? ` · ${stats.unassigned} sin club` : ""} · ${stats.active} activos`}
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="fu-stat">
              <b>{list.length}</b>
              <span>Resultados</span>
            </div>
            <div className="fu-stat">
              <b>{stats.active}</b>
              <span>Activos</span>
            </div>
            <div className="fu-stat">
              <b>{CATALOG_STATS.playersActive}</b>
              <span>Pros BSC</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href="/fantasy" className="fu-btn fu-btn-gold">
              Fantasy
            </Link>
            <Link href="/teams" className="fu-btn fu-btn-ghost">
              Clubes
            </Link>
          </>
        }
        showcase={
          topPros.length >= 3 ? (
            <div className="fu-cards-showcase" style={{ minHeight: 300 }}>
              {topPros.map((p, i) => (
                <div key={p.slug} className={`fu-card-float fu-card-float-${i + 1}`}>
                  <PlayerCard playerSlug={p.slug} size="md" href={`/players/${p.slug}`} />
                </div>
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="bf-players-toolbar">
        <label className="bf-players-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            placeholder="Buscar por IGN, equipo o nombre real…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        <select
          className="bf-players-select"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          aria-label="Filtrar por equipo"
        >
          <option value="all">Todos los equipos</option>
          {teamsForFilter.map(({ slug, name, count }) => (
            <option key={slug} value={slug}>
              {name}
              {count > 0 ? ` (${count})` : ""}
            </option>
          ))}
        </select>
      </div>

      <SectionTabsBar
        entityLogo={
          <TournamentLogo slug="bsc-2026-brawl-cup" name="BSC 2026" size={44} glow />
        }
      >
        <div className="bf-home-tabs">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`bf-home-tab ${region === r ? "is-on" : ""}`}
              onClick={() => setRegion(r)}
            >
              {r === "all" ? "Global" : r}
            </button>
          ))}
        </div>
      </SectionTabsBar>

      <div className="bf-players-filters">
        {(
          [
            ["all", "Todos"],
            ["active", "Activos"],
            ["inactive", "Inactivos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`bf-players-chip ${status === key ? "is-on" : ""}`}
            onClick={() => setStatus(key)}
          >
            {label}
          </button>
        ))}
        <span className="bf-players-sort-label">Ordenar:</span>
        {(
          [
            ["index", "Índice"],
            ["fantasy", "Fantasy"],
            ["price", "Precio"],
            ["name", "Nombre"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`bf-players-chip ${sortBy === key ? "is-on" : ""}`}
            onClick={() => setSortBy(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="bf-players-count">
        {list.length} resultados
        {query.trim() ? ` para “${query.trim()}”` : ""}
        · sync {CATALOG_STATS.players} en catálogo
      </p>

      <div className="bf-players-table-wrap">
        <table className="bf-players-table">
          <thead>
            <tr>
              <th>Ranking</th>
              <th>Jugador</th>
              <th>Equipo</th>
              <th>Rol</th>
              <th>Región</th>
              <th>Índice</th>
              <th>Fantasy</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <PlayerRow
                key={p.slug}
                player={p}
                index={i}
                muted={!p.teamSlug}
              />
            ))}
          </tbody>
        </table>
      </div>

      {list.length === 0 && (
        <p className="bf-home-empty fu-panel">No hay jugadores con estos filtros. Prueba otra búsqueda o región.</p>
      )}
    </PageUltraShell>
  );
}

function PlayerRow({
  player: p,
  index,
  muted,
}: {
  player: EsportsPlayer;
  index: number;
  muted?: boolean;
}) {
  const price = getPlayerPrice(p.slug);
  const role = getFantasyRole(p.slug);

  return (
    <tr className={p.status !== "active" || muted ? "is-muted" : ""}>
      <td className="bf-players-rank">{index + 1}</td>
      <td>
        <Link href={`/players/${p.slug}`} className="bf-players-name-cell">
          <span className="bf-players-ign">{p.ign}</span>
          {p.realName && <span className="bf-players-real">{p.realName}</span>}
        </Link>
      </td>
      <td>
        {p.teamSlug ? (
          <Link href={`/teams/${p.teamSlug}`} className="bf-players-team-cell">
            <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={28} />
            <span>{teamName(p.teamSlug)}</span>
          </Link>
        ) : (
          <span className="bf-players-free">{PLAYER_UNASSIGNED_LABEL}</span>
        )}
      </td>
      <td>{role}</td>
      <td>
        <RegionBadge region={resolvePlayerRegion(p.teamSlug, p.region)} />
      </td>
      <td className="bf-players-stat">{p.rating.toFixed(1)}</td>
      <td className="bf-players-stat">{p.fantasyPoints}</td>
      <td className="bf-players-stat gold">${price.toFixed(1)}M</td>
      <td>
        <span className={`bf-players-status is-${p.status}`}>{statusLabel(p.status)}</span>
      </td>
    </tr>
  );
}
