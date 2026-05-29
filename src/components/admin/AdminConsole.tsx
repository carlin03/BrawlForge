"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  RefreshCw,
  Users,
  User,
  Image,
  Newspaper,
  Plus,
  Save,
  Home,
  FileSpreadsheet,
  UserCircle,
} from "lucide-react";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { BrandMark } from "@/components/ui/BrandMark";
import { AdminLogoPanel } from "@/components/admin/AdminLogoPanel";
import { AdminImportPanel } from "@/components/admin/AdminImportPanel";
import { AdminField, AdminFieldRow, AdminMeta } from "@/components/admin/AdminField";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { getLatestNews } from "@/lib/data";
import { BSC_2026_ADMIN_TEAM_COUNT, mergeAdminTeamRows } from "@/lib/data/admin-bsc-teams";
import { mergeAdminPlayerRows } from "@/lib/data/admin-bsc-players";

type Tab = "teams" | "players" | "logos" | "news" | "import" | "users";

type TeamRow = {
  slug: string;
  name: string;
  tag: string;
  region: string;
  country: string;
  earnings: number;
  rank: number | null;
  rank_change?: number;
  roster_slugs: string[] | string;
  logo_url?: string | null;
  description?: string | null;
};

type PlayerRow = {
  slug: string;
  ign: string;
  real_name?: string | null;
  team_slug: string | null;
  region: string;
  role: string;
  status: string;
  fantasy_points: number;
  fantasy_ownership: number;
  rating: number;
  bio?: string | null;
  photo_url?: string | null;
};

type NewsRow = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[] | string;
  category: string;
  published_at: string | null;
  author: string;
  read_minutes: number;
  cover_accent: string;
  related_teams: string[] | string;
  related_tournament: string | null;
  hot: boolean;
};

const NEWS_CATEGORIES = ["Esports", "Fantasy", "Torneos", "Resultados", "Fichajes"] as const;
const COVER_ACCENTS = [
  { id: "gold", label: "Dorado" },
  { id: "blue", label: "Azul" },
  { id: "red", label: "Rojo" },
  { id: "green", label: "Verde" },
] as const;
const REGIONS = ["GLOBAL", "EMEA", "EA", "NA", "SA", "CN"] as const;

const TAB_CONFIG: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "teams", label: "Equipos", icon: Users },
  { id: "players", label: "Jugadores", icon: User },
  { id: "logos", label: "Logos", icon: Image },
  { id: "news", label: "Noticias", icon: Newspaper },
  { id: "import", label: "CSV → Supabase", icon: FileSpreadsheet },
  { id: "users", label: "Usuarios", icon: UserCircle },
];

const TAB_IDS: Tab[] = ["teams", "players", "logos", "news", "import", "users"];

function tabFromQuery(raw: string | null): Tab | null {
  if (raw && TAB_IDS.includes(raw as Tab)) return raw as Tab;
  return null;
}

export function AdminConsole() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => tabFromQuery(searchParams.get("tab")) ?? "teams");

  useEffect(() => {
    const next = tabFromQuery(searchParams.get("tab"));
    if (next) setTab(next);
  }, [searchParams]);
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsRow | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamRegionFilter, setTeamRegionFilter] = useState<"all" | "new" | string>("all");
  const [playerSearch, setPlayerSearch] = useState("");
  const [newsSearch, setNewsSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    setMsgError(false);
    try {
      const res = await fetch("/api/admin/catalog?type=all");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setTeams(mergeAdminTeamRows(Array.isArray(data.teams) ? data.teams : null) as TeamRow[]);
      setPlayers(mergeAdminPlayerRows(Array.isArray(data.players) ? data.players : null) as PlayerRow[]);
      setNews(data.news ?? []);
      setMsg("Datos actualizados");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(entity: "team" | "player" | "news", row: TeamRow | PlayerRow | NewsRow) {
    setLoading(true);
    setMsg("");
    setMsgError(false);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, row }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg(data.message || "Cambios guardados");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }

  const filteredTeams = teams
    .filter((t) => {
      if (teamRegionFilter !== "all") return t.region === teamRegionFilter;
      return true;
    })
    .filter(
      (t) =>
        !teamSearch ||
        t.slug.includes(teamSearch.toLowerCase()) ||
        t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
        t.tag.toLowerCase().includes(teamSearch.toLowerCase()),
    );

  const filteredPlayers = players.filter(
    (p) =>
      !playerSearch ||
      p.slug.includes(playerSearch.toLowerCase()) ||
      p.ign.toLowerCase().includes(playerSearch.toLowerCase()) ||
      (p.team_slug ?? "").includes(playerSearch.toLowerCase()) ||
      teams.find((t) => t.slug === p.team_slug)?.name.toLowerCase().includes(playerSearch.toLowerCase()),
  );

  const newsList = news.length
    ? news
    : getLatestNews(50).map((n) => ({
        slug: n.slug,
        title: n.title,
        excerpt: n.excerpt,
        body: n.body,
        category: n.category,
        published_at: n.date,
        author: n.author,
        read_minutes: n.readMinutes,
        cover_accent: n.coverAccent,
        related_teams: n.relatedTeams ?? [],
        related_tournament: n.relatedTournament ?? null,
        hot: Boolean(n.hot),
      }));

  const filteredNews = newsList.filter(
    (n) =>
      !newsSearch ||
      n.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
      n.category.toLowerCase().includes(newsSearch.toLowerCase()),
  );

  const rosterStr = (r: TeamRow) =>
    Array.isArray(r.roster_slugs) ? r.roster_slugs.join(", ") : String(r.roster_slugs ?? "");

  const teamBySlug = (slug: string) => teams.find((t) => t.slug === slug);

  return (
    <div className="bf-admin-page bf-admin-console">
      <header className="bf-admin-hero">
        <div className="bf-admin-hero-bg" aria-hidden />
        <div className="bf-admin-hero-inner">
          <div>
            <span className="bf-admin-hero-kicker">
              <Shield size={16} /> Panel de control
            </span>
            <h1 className="bf-admin-hero-title">Centro de edición</h1>
            <p className="bf-admin-hero-lead">
              Misma calidad que la web pública: equipos, jugadores, logos y noticias en un solo sitio.
            </p>
            <div className="bf-admin-hero-stats">
              <span className="bf-admin-stat-pill">
                <strong>{teams.length}</strong> / {BSC_2026_ADMIN_TEAM_COUNT} equipos BSC
              </span>
              <span className="bf-admin-stat-pill">
                <strong>{players.length}</strong> jugadores
              </span>
              <span className="bf-admin-stat-pill">
                <strong>{newsList.length}</strong> noticias
              </span>
            </div>
          </div>
          <div className="bf-admin-head-actions">
            <button type="button" className="bp-btn bp-btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? "bf-spin" : undefined} /> Actualizar
            </button>
            <Link href="/" className="bp-btn bp-btn-gold">
              <Home size={16} /> Ver web
            </Link>
          </div>
        </div>
      </header>

      <div className="bf-admin-tabs-brand">
        <BrandMark size={40} />
        <span>
          Brawl<em>Forge</em> Admin
        </span>
      </div>
      <nav className="bf-admin-tabs" aria-label="Secciones admin">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`bf-admin-tab ${tab === id ? "is-on" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      {msg && <div className={`bf-admin-toast ${msgError ? "is-error" : ""}`}>{msg}</div>}

      {tab === "logos" && <AdminLogoPanel />}

      {tab === "import" && <AdminImportPanel onDone={load} />}

      {tab === "users" && <AdminUsersPanel />}

      {tab === "teams" && (
        <div className="bf-admin-split">
          <aside className="bf-admin-sidebar">
            <div className="bf-admin-region-filters" role="group" aria-label="Filtrar equipos">
              {(["all", ...REGIONS.filter((r) => r !== "GLOBAL" && r !== "CN")] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`bf-admin-region-chip ${teamRegionFilter === id ? "is-on" : ""}`}
                  onClick={() => setTeamRegionFilter(id)}
                >
                  {id === "all" ? "Todos" : id}
                </button>
              ))}
            </div>
            <input
              className="bf-admin-search"
              placeholder="Buscar por nombre o tag…"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
            />
            <p className="bf-admin-field-hint" style={{ margin: "0 0 8px" }}>
              {filteredTeams.length} de {teams.length} clubes
              {teamRegionFilter !== "all" ? ` · filtro ${teamRegionFilter}` : ""}
            </p>
            <ul className="bf-admin-list-scroll">
              {filteredTeams.length === 0 && (
                <li className="bf-admin-list-item">
                  <p className="bf-admin-field-hint" style={{ padding: 12 }}>
                    Ningún club con este filtro. Prueba &quot;Todos&quot; o borra la búsqueda.
                  </p>
                </li>
              )}
              {filteredTeams.map((t) => (
                  <li key={t.slug} className="bf-admin-list-item">
                    <button
                      type="button"
                      className={`bf-admin-list-card ${selectedTeam?.slug === t.slug ? "is-on" : ""}`}
                      onClick={() =>
                        setSelectedTeam({
                          ...t,
                          roster_slugs: rosterStr(t),
                        } as TeamRow & { roster_slugs: string })
                      }
                    >
                      <TeamLogo slug={t.slug} name={t.name} size={44} />
                      <span className="bf-admin-list-card-body">
                        <span className="bf-admin-list-card-title">{t.tag || t.name}</span>
                        <span className="bf-admin-list-card-sub">{t.name}</span>
                        <span className="bf-admin-list-card-meta">
                          #{t.rank ?? "—"} · {t.region}
                        </span>
                      </span>
                    </button>
                  </li>
              ))}
            </ul>
          </aside>

          {selectedTeam ? (
            <form
              className="bf-admin-editor"
              onSubmit={(e) => {
                e.preventDefault();
                const roster = String(selectedTeam.roster_slugs)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                save("team", { ...selectedTeam, roster_slugs: roster });
              }}
            >
              <div className="bf-admin-editor-head">
                <TeamLogo slug={selectedTeam.slug} name={selectedTeam.name} size={72} />
                <div>
                  <h2>{selectedTeam.name}</h2>
                  <p className="bf-admin-field-hint" style={{ margin: 0 }}>
                    {selectedTeam.tag} · {selectedTeam.country}
                  </p>
                </div>
              </div>

              <AdminFieldRow>
                <AdminField label="Nombre del club">
                  <input
                    value={selectedTeam.name}
                    onChange={(e) => setSelectedTeam({ ...selectedTeam, name: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Tag (abreviatura)">
                  <input
                    value={selectedTeam.tag}
                    onChange={(e) => setSelectedTeam({ ...selectedTeam, tag: e.target.value })}
                  />
                </AdminField>
              </AdminFieldRow>

              <AdminFieldRow>
                <AdminField label="Región">
                  <select
                    value={selectedTeam.region}
                    onChange={(e) => setSelectedTeam({ ...selectedTeam, region: e.target.value })}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="País">
                  <input
                    value={selectedTeam.country}
                    onChange={(e) => setSelectedTeam({ ...selectedTeam, country: e.target.value })}
                  />
                </AdminField>
              </AdminFieldRow>

              <AdminFieldRow>
                <AdminField label="Ranking global">
                  <input
                    type="number"
                    value={selectedTeam.rank ?? ""}
                    onChange={(e) =>
                      setSelectedTeam({
                        ...selectedTeam,
                        rank: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </AdminField>
                <AdminField label="Premios totales ($)">
                  <input
                    type="number"
                    value={selectedTeam.earnings}
                    onChange={(e) => setSelectedTeam({ ...selectedTeam, earnings: Number(e.target.value) })}
                  />
                </AdminField>
              </AdminFieldRow>

              <AdminField label="Descripción del club" hint="Texto que aparece en la ficha del equipo">
                <textarea
                  rows={4}
                  value={selectedTeam.description ?? ""}
                  onChange={(e) => setSelectedTeam({ ...selectedTeam, description: e.target.value })}
                />
              </AdminField>

              <AdminField
                label="Plantilla (jugadores)"
                hint="Nombres internos separados por coma — solo si sabes los IDs del catálogo"
              >
                <textarea
                  rows={4}
                  value={
                    Array.isArray(selectedTeam.roster_slugs)
                      ? selectedTeam.roster_slugs.join(", ")
                      : String(selectedTeam.roster_slugs ?? "")
                  }
                  onChange={(e) => setSelectedTeam({ ...selectedTeam, roster_slugs: e.target.value })}
                />
              </AdminField>

              <AdminField label="URL del logo" hint="Opcional — también puedes cambiarlo en la pestaña Logos">
                <input
                  value={selectedTeam.logo_url ?? ""}
                  onChange={(e) => setSelectedTeam({ ...selectedTeam, logo_url: e.target.value })}
                  placeholder="https://…"
                />
              </AdminField>

              <AdminMeta>Ref: {selectedTeam.slug}</AdminMeta>

              <div className="bf-admin-editor-actions">
                <button type="submit" className="bp-btn bp-btn-gold" disabled={loading}>
                  <Save size={16} /> Guardar equipo
                </button>
                <button
                  type="button"
                  className="bp-btn bp-btn-ghost"
                  onClick={() => {
                    setTab("logos");
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("tab", "logos");
                      url.searchParams.set("team", selectedTeam.slug);
                      window.history.replaceState(null, "", url.pathname + url.search);
                    }
                  }}
                >
                  <Image size={16} /> Cambiar logo
                </button>
                <Link href={`/teams/${selectedTeam.slug}`} className="bp-btn bp-btn-ghost" target="_blank">
                  Ver en la web
                </Link>
              </div>
            </form>
          ) : (
            <div className="bf-admin-empty-editor">Selecciona un equipo de la lista</div>
          )}
        </div>
      )}

      {tab === "players" && (
        <div className="bf-admin-split">
          <aside className="bf-admin-sidebar">
            <input
              className="bf-admin-search"
              placeholder="Buscar por IGN o club…"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
            />
            <ul className="bf-admin-list-scroll">
              <p className="bf-admin-field-hint" style={{ margin: "0 0 8px" }}>
                {filteredPlayers.length} jugadores del circuito BSC
              </p>
              {filteredPlayers.map((p) => {
                const club = p.team_slug ? teamBySlug(p.team_slug) : null;
                return (
                  <li key={p.slug} className="bf-admin-list-item">
                    <button
                      type="button"
                      className={`bf-admin-list-card ${selectedPlayer?.slug === p.slug ? "is-on" : ""}`}
                      onClick={() => setSelectedPlayer({ ...p })}
                    >
                      {p.team_slug ? (
                        <TeamLogo slug={p.team_slug} name={club?.name} size={44} />
                      ) : (
                        <span className="bf-admin-list-fallback" style={{ width: 44, height: 44, fontSize: 18 }}>
                          ?
                        </span>
                      )}
                      <span className="bf-admin-list-card-body">
                        <span className="bf-admin-list-card-title">{p.ign}</span>
                        <span className="bf-admin-list-card-sub">
                          {club ? `${club.tag} · ${club.name}` : "Sin equipo"}
                        </span>
                        <span className="bf-admin-list-card-meta">
                          OVR {p.fantasy_points} · {p.role}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {selectedPlayer ? (
            <form
              className="bf-admin-editor"
              onSubmit={(e) => {
                e.preventDefault();
                save("player", selectedPlayer);
              }}
            >
              <div className="bf-admin-editor-head">
                <PlayerPhoto
                  playerSlug={selectedPlayer.slug}
                  teamSlug={selectedPlayer.team_slug ?? undefined}
                  size={96}
                  photoUrlOverride={selectedPlayer.photo_url}
                />
                <div>
                  <h2>{selectedPlayer.ign}</h2>
                  {selectedPlayer.real_name && (
                    <p className="bf-admin-field-hint" style={{ margin: 0 }}>
                      {selectedPlayer.real_name}
                    </p>
                  )}
                </div>
              </div>

              <AdminFieldRow>
                <AdminField label="IGN (nombre en juego)">
                  <input
                    value={selectedPlayer.ign}
                    onChange={(e) => setSelectedPlayer({ ...selectedPlayer, ign: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Nombre real">
                  <input
                    value={selectedPlayer.real_name ?? ""}
                    onChange={(e) => setSelectedPlayer({ ...selectedPlayer, real_name: e.target.value })}
                  />
                </AdminField>
              </AdminFieldRow>

              <AdminField label="Club" hint="Elige el equipo al que pertenece">
                <select
                  value={selectedPlayer.team_slug ?? ""}
                  onChange={(e) =>
                    setSelectedPlayer({ ...selectedPlayer, team_slug: e.target.value || null })
                  }
                >
                  <option value="">— Sin equipo —</option>
                  {teams
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.tag} · {t.name}
                      </option>
                    ))}
                </select>
              </AdminField>

              <AdminFieldRow>
                <AdminField label="Rol">
                  <input
                    value={selectedPlayer.role}
                    onChange={(e) => setSelectedPlayer({ ...selectedPlayer, role: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Estado">
                  <select
                    value={selectedPlayer.status}
                    onChange={(e) => setSelectedPlayer({ ...selectedPlayer, status: e.target.value })}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="retired">Retirado</option>
                  </select>
                </AdminField>
              </AdminFieldRow>

              <AdminField label="Región">
                <select
                  value={selectedPlayer.region}
                  onChange={(e) => setSelectedPlayer({ ...selectedPlayer, region: e.target.value })}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </AdminField>

              <AdminField label="Biografía" hint="Aparece en la ficha del jugador">
                <textarea
                  rows={4}
                  value={selectedPlayer.bio ?? ""}
                  onChange={(e) => setSelectedPlayer({ ...selectedPlayer, bio: e.target.value })}
                />
              </AdminField>

              <AdminField
                label="URL foto del jugador"
                hint="Pega un enlace directo a la imagen (PNG/JPG). Se verá en cartas FUT, home y ficha."
              >
                <input
                  type="url"
                  value={selectedPlayer.photo_url ?? ""}
                  onChange={(e) => setSelectedPlayer({ ...selectedPlayer, photo_url: e.target.value })}
                  placeholder="https://…"
                />
                {selectedPlayer.photo_url?.trim() && (
                  <div className="bf-admin-photo-preview">
                    <img src={selectedPlayer.photo_url.trim()} alt="" />
                  </div>
                )}
              </AdminField>

              <AdminFieldRow>
                <AdminField label="Puntos fantasy (OVR)">
                  <input
                    type="number"
                    value={selectedPlayer.fantasy_points}
                    onChange={(e) =>
                      setSelectedPlayer({ ...selectedPlayer, fantasy_points: Number(e.target.value) })
                    }
                  />
                </AdminField>
                <AdminField label="Propiedad (%)">
                  <input
                    type="number"
                    value={selectedPlayer.fantasy_ownership}
                    onChange={(e) =>
                      setSelectedPlayer({ ...selectedPlayer, fantasy_ownership: Number(e.target.value) })
                    }
                  />
                </AdminField>
                <AdminField label="Rating">
                  <input
                    type="number"
                    step="0.01"
                    value={selectedPlayer.rating}
                    onChange={(e) => setSelectedPlayer({ ...selectedPlayer, rating: Number(e.target.value) })}
                  />
                </AdminField>
              </AdminFieldRow>

              <AdminMeta>Ref: {selectedPlayer.slug}</AdminMeta>

              <div className="bf-admin-editor-actions">
                <button type="submit" className="bp-btn bp-btn-gold" disabled={loading}>
                  <Save size={16} /> Guardar jugador
                </button>
                <Link href={`/players/${selectedPlayer.slug}`} className="bp-btn bp-btn-ghost" target="_blank">
                  Ver en la web
                </Link>
              </div>
            </form>
          ) : (
            <div className="bf-admin-empty-editor">Selecciona un jugador de la lista</div>
          )}
        </div>
      )}

      {tab === "news" && (
        <div className="bf-admin-split">
          <aside className="bf-admin-sidebar">
            <button
              type="button"
              className="bp-btn bp-btn-gold bf-admin-btn-new"
              onClick={() =>
                setSelectedNews({
                  slug: `noticia-${Date.now()}`,
                  title: "Nueva noticia",
                  excerpt: "",
                  body: "",
                  category: "Esports",
                  published_at: new Date().toISOString().slice(0, 10),
                  author: "BrawlForge",
                  read_minutes: 3,
                  cover_accent: "gold",
                  related_teams: "",
                  related_tournament: null,
                  hot: false,
                })
              }
            >
              <Plus size={18} /> Crear noticia
            </button>
            <input
              className="bf-admin-search"
              placeholder="Buscar noticia…"
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
            />
            <ul className="bf-admin-list-scroll">
              {filteredNews.map((n) => (
                <li key={n.slug} className="bf-admin-list-item">
                  <button
                    type="button"
                    className={`bf-admin-list-card ${selectedNews?.slug === n.slug ? "is-on" : ""}`}
                    onClick={() =>
                      setSelectedNews({
                        ...n,
                        hot: Boolean(n.hot),
                        body: Array.isArray(n.body) ? n.body.join("\n") : String(n.body ?? ""),
                        related_teams: Array.isArray(n.related_teams)
                          ? n.related_teams.join(", ")
                          : String(n.related_teams ?? ""),
                      })
                    }
                  >
                    <span
                      className="bf-admin-news-dot"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background:
                          n.cover_accent === "blue"
                            ? "var(--bp-blue-soft)"
                            : n.cover_accent === "red"
                              ? "var(--bp-red-soft)"
                              : "var(--bp-gold-soft)",
                        flexShrink: 0,
                      }}
                    />
                    <span className="bf-admin-list-card-body">
                      <span className="bf-admin-list-card-title">{n.title || "Sin título"}</span>
                      <span className="bf-admin-list-card-sub">
                        {n.category} · {n.published_at ?? "Sin fecha"}
                        {n.hot ? " · Destacada" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {selectedNews ? (
            <form
              className="bf-admin-editor"
              onSubmit={(e) => {
                e.preventDefault();
                const body = String(selectedNews.body)
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const related = String(selectedNews.related_teams)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                save("news", { ...selectedNews, body, related_teams: related });
              }}
            >
              <div className="bf-admin-news-preview">
                <span className="bp-chip bp-chip-gold">{selectedNews.category}</span>
                <h3>{selectedNews.title || "Título de la noticia"}</h3>
                <p>{selectedNews.excerpt || "El extracto aparecerá aquí…"}</p>
              </div>

              <AdminField label="Título">
                <input
                  value={selectedNews.title}
                  onChange={(e) => setSelectedNews({ ...selectedNews, title: e.target.value })}
                />
              </AdminField>

              <AdminField label="Extracto" hint="Resumen corto en listados y portada">
                <textarea
                  rows={3}
                  value={selectedNews.excerpt}
                  onChange={(e) => setSelectedNews({ ...selectedNews, excerpt: e.target.value })}
                />
              </AdminField>

              <AdminField label="Artículo" hint="Un párrafo por línea">
                <textarea
                  rows={8}
                  value={
                    Array.isArray(selectedNews.body)
                      ? selectedNews.body.join("\n")
                      : String(selectedNews.body ?? "")
                  }
                  onChange={(e) => setSelectedNews({ ...selectedNews, body: e.target.value })}
                />
              </AdminField>

              <AdminFieldRow>
                <AdminField label="Categoría">
                  <select
                    value={selectedNews.category}
                    onChange={(e) => setSelectedNews({ ...selectedNews, category: e.target.value })}
                  >
                    {NEWS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="Color de portada">
                  <select
                    value={selectedNews.cover_accent}
                    onChange={(e) => setSelectedNews({ ...selectedNews, cover_accent: e.target.value })}
                  >
                    {COVER_ACCENTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </AdminField>
              </AdminFieldRow>

              <AdminFieldRow>
                <AdminField label="Fecha de publicación">
                  <input
                    type="date"
                    value={selectedNews.published_at ?? ""}
                    onChange={(e) => setSelectedNews({ ...selectedNews, published_at: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Minutos de lectura">
                  <input
                    type="number"
                    min={1}
                    value={selectedNews.read_minutes}
                    onChange={(e) =>
                      setSelectedNews({ ...selectedNews, read_minutes: Number(e.target.value) })
                    }
                  />
                </AdminField>
              </AdminFieldRow>

              <AdminField label="Autor">
                <input
                  value={selectedNews.author}
                  onChange={(e) => setSelectedNews({ ...selectedNews, author: e.target.value })}
                />
              </AdminField>

              <AdminField
                label="Clubes relacionados"
                hint="Opcional — elige clubs del listado (referencias internas separadas por coma)"
              >
                <input
                  value={
                    Array.isArray(selectedNews.related_teams)
                      ? selectedNews.related_teams.join(", ")
                      : String(selectedNews.related_teams ?? "")
                  }
                  onChange={(e) => setSelectedNews({ ...selectedNews, related_teams: e.target.value })}
                  placeholder="crazy-raccoon, sk-gaming…"
                />
              </AdminField>

              <label className="bf-admin-check">
                <input
                  type="checkbox"
                  checked={selectedNews.hot}
                  onChange={(e) => setSelectedNews({ ...selectedNews, hot: e.target.checked })}
                />
                Destacar en portada
              </label>

              <AdminMeta>Ref: {selectedNews.slug}</AdminMeta>

              <div className="bf-admin-editor-actions">
                <button type="submit" className="bp-btn bp-btn-gold" disabled={loading}>
                  <Save size={16} /> Publicar cambios
                </button>
                <Link href={`/news/${selectedNews.slug}`} className="bp-btn bp-btn-ghost" target="_blank">
                  Ver noticia
                </Link>
              </div>
            </form>
          ) : (
            <div className="bf-admin-empty-editor">Selecciona una noticia o crea una nueva</div>
          )}
        </div>
      )}

    </div>
  );
}
