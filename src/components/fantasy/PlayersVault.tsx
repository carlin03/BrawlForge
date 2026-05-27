"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NovaPageHero } from "@/components/nova/NovaPageHero";
import { NovaBlock } from "@/components/nova/NovaBlock";
import { ProRow } from "@/components/esports/ProRow";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  players,
  getTeam,
  getActivePlayers,
  getPlayersWithTeam,
  getTeamsWithPlayers,
} from "@/lib/data";
import { getPlayerPrice, transferMarket } from "@/lib/data/fantasy";
import type { FantasyRole } from "@/lib/data/fantasy-meta";
import { getFantasyRole } from "@/lib/data/fantasy-meta";
import type { PlayerStatus } from "@/lib/data/players";
import type { Region } from "@/lib/types";

const PAGE_SIZE = 60;
const REGIONS: (Region | "all")[] = ["all", "EMEA", "NA", "SA", "EA"];
const ROLES: (FantasyRole | "all")[] = ["all", "Carry", "Aggro", "Control", "Support", "Sniper"];
const STATUS_FILTERS: { id: "all" | PlayerStatus; label: string }[] = [
  { id: "active", label: "Activos" },
  { id: "all", label: "Todos" },
  { id: "retired", label: "Retirados" },
  { id: "inactive", label: "Inactivos" },
];

type SortKey = "fantasy" | "rating" | "name" | "team";

export function PlayersVault() {
  const [region, setRegion] = useState<Region | "all">("all");
  const [role, setRole] = useState<FantasyRole | "all">("all");
  const [status, setStatus] = useState<"all" | PlayerStatus>("active");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("rating");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const teamsWithPlayers = useMemo(() => getTeamsWithPlayers(), []);
  const activeCount = useMemo(() => getActivePlayers().length, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...players];

    if (status !== "all") list = list.filter((p) => p.status === status);
    if (region !== "all") list = list.filter((p) => p.region === region);
    if (role !== "all") list = list.filter((p) => getFantasyRole(p.slug) === role);
    if (teamFilter !== "all") list = list.filter((p) => p.teamSlug === teamFilter);
    if (q) {
      list = list.filter(
        (p) =>
          p.ign.toLowerCase().includes(q) ||
          p.slug.includes(q) ||
          p.realName?.toLowerCase().includes(q) ||
          getTeam(p.teamSlug)?.name.toLowerCase().includes(q) ||
          getTeam(p.teamSlug)?.tag.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      if (sort === "fantasy") return b.fantasyPoints - a.fantasyPoints;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "name") return a.ign.localeCompare(b.ign);
      const ta = getTeam(a.teamSlug)?.name ?? "zzz";
      const tb = getTeam(b.teamSlug)?.name ?? "zzz";
      return ta.localeCompare(tb);
    });

    return list;
  }, [region, role, status, teamFilter, query, sort]);

  const visibleList = filtered.slice(0, visible);

  return (
    <>
      <NovaPageHero
        kicker="Base de datos · BSC"
        title="Jugadores"
        accent={`${players.length} pros.`}
        subtitle={`${activeCount} activos · ${getPlayersWithTeam().length} con plantilla BSC`}
        tone="blue"
        actions={<Link href="/fantasy" className="nv-btn nv-btn-yellow">Pro Picks</Link>}
      />

      <div className="nv-kpis">
        <div className="nv-kpi"><div className="nv-kpi-val c-blue">{activeCount}</div><div className="nv-kpi-lbl">Activos</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-yellow">{filtered.length}</div><div className="nv-kpi-lbl">Filtrados</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-red">{teamsWithPlayers.length}</div><div className="nv-kpi-lbl">Clubes</div></div>
      </div>

      <div className="nv-filters">
        <div className="fx-vault-search" style={{ flex: 1, minWidth: 200 }}>
          <Search className="h-4 w-4" style={{ color: "var(--nv-dim)" }} />
          <input
            type="search"
            placeholder="IGN, equipo, nick..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
            className="fx-vault-search-input"
          />
        </div>
        {STATUS_FILTERS.map((s) => (
          <button key={s.id} type="button" className={`nv-chip ${status === s.id ? "is-on-blue" : ""}`} onClick={() => { setStatus(s.id); setVisible(PAGE_SIZE); }}>
            {s.label}
          </button>
        ))}
        {REGIONS.map((r) => (
          <button key={r} type="button" className={`nv-chip ${region === r ? "is-on" : ""}`} onClick={() => { setRegion(r); setVisible(PAGE_SIZE); }}>
            {r === "all" ? "Global" : r}
          </button>
        ))}
        {ROLES.map((r) => (
          <button key={r} type="button" className={`nv-chip ${role === r ? "is-on-red" : ""}`} onClick={() => { setRole(r); setVisible(PAGE_SIZE); }}>
            {r === "all" ? "Rol" : r}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="fx-vault-sort-select">
          <option value="rating">Rating</option>
          <option value="fantasy">Pts evento</option>
          <option value="name">Nombre</option>
          <option value="team">Equipo</option>
        </select>
      </div>

      <div className="nv-filters" style={{ marginTop: -6 }}>
        <button type="button" className={`fx-market-team-chip ${teamFilter === "all" ? "fx-market-team-chip-active" : ""}`} onClick={() => setTeamFilter("all")}>
          Todos los clubes
        </button>
        {teamsWithPlayers.slice(0, 24).map(({ slug }) => {
          const team = getTeam(slug);
          if (!team) return null;
          return (
            <button
              key={slug}
              type="button"
              className={`fx-market-team-chip ${teamFilter === slug ? "fx-market-team-chip-active" : ""}`}
              onClick={() => { setTeamFilter(slug); setVisible(PAGE_SIZE); }}
            >
              <TeamLogo slug={slug} name={team.name} size={18} />
              {team.tag}
            </button>
          );
        })}
        {teamFilter !== "all" && (
          <button type="button" className="nv-chip" onClick={() => setTeamFilter("all")}>✕ Quitar club</button>
        )}
      </div>

      <NovaBlock title={`${filtered.length} jugadores`}>
        <table className="es-table es-table-premium">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Región</th>
              <th>Forma</th>
              <th>Rating</th>
              <th>Pts evento</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {visibleList.map((p, i) => {
              const mp = transferMarket.find((m) => m.playerSlug === p.slug);
              const st = !p.teamSlug && p.status === "active" ? "fa" as const : p.status !== "active" ? p.status : undefined;
              return (
                <ProRow
                  key={p.slug}
                  playerSlug={p.slug}
                  rank={i + 1}
                  price={getPlayerPrice(p.slug)}
                  form={mp?.form}
                  status={st}
                  showRank
                  showRegion
                  showForm
                  showRating
                  showFantasy
                  showPrice
                />
              );
            })}
          </tbody>
        </table>
        {visible < filtered.length && (
          <button type="button" className="fx-vault-load-more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Cargar más ({filtered.length - visible})
          </button>
        )}
        {filtered.length === 0 && (
          <p className="nv-dim" style={{ textAlign: "center", padding: 32 }}>Sin resultados.</p>
        )}
      </NovaBlock>

      <div style={{ marginTop: 12, textAlign: "right" }}>
        <Link href="/fantasy" className="nv-btn nv-btn-yellow">Ir a Pro Picks</Link>
      </div>
    </>
  );
}
