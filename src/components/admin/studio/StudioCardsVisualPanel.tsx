"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { StudioColorPicker, StudioPanel, StudioToast } from "./studio-ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { parseCardThemeMeta, type CardThemeMeta } from "@/lib/data/card-theme-meta";
import { getTeamCardTheme, teamCardThemeVars } from "@/lib/data/team-card-theme";
import { mergeAdminTeamRows } from "@/lib/data/admin-bsc-teams";
import { mergeAdminPlayerRows } from "@/lib/data/admin-bsc-players";
import type { AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";
import type { AdminPlayerCatalogRow } from "@/lib/data/admin-catalog-fields";

function themeFromTeam(slug: string, meta: Record<string, unknown>): CardThemeMeta {
  const parsed = parseCardThemeMeta(meta);
  if (parsed) return parsed;
  const t = getTeamCardTheme(slug);
  return { primary: t.primary, secondary: t.secondary, glow: t.glow };
}

function MiniCardPreview({
  label,
  theme,
  logo,
}: {
  label: string;
  theme: CardThemeMeta;
  logo: React.ReactNode;
}) {
  return (
    <div
      className="bf-admin-card-preview"
      style={teamCardThemeVars(theme, "md") as React.CSSProperties}
    >
      <div className="bf-admin-card-preview-bg" aria-hidden />
      <div className="bf-admin-card-preview-body">
        {logo}
        <span>{label}</span>
      </div>
    </div>
  );
}

export function StudioCardsVisualPanel() {
  const [teams, setTeams] = useState<AdminTeamCatalogRow[]>([]);
  const [players, setPlayers] = useState<AdminPlayerCatalogRow[]>([]);
  const [mode, setMode] = useState<"teams" | "players">("teams");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [theme, setTheme] = useState<CardThemeMeta>({
    primary: "#ffc82e",
    secondary: "#1a1608",
    glow: "#ffd54f",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog?type=all");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const t = mergeAdminTeamRows(data.teams ?? null);
      const p = mergeAdminPlayerRows(data.players ?? null);
      setTeams(t);
      setPlayers(p);
      if (!selectedSlug && t.length) {
        setSelectedSlug(t[0].slug);
        setTheme(themeFromTeam(t[0].slug, t[0].meta));
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (mode === "teams") {
      const row = teams.find((t) => t.slug === selectedSlug);
      if (row) {
        setTheme(themeFromTeam(row.slug, row.meta));
        setBannerUrl(String(row.meta?.banner_url ?? ""));
      }
    } else {
      const row = players.find((p) => p.slug === selectedSlug);
      if (row) {
        setPhotoUrl(row.photo_url ?? "");
        setBannerUrl(String(row.meta?.banner_url ?? ""));
        if (row.team_slug) {
          const club = teams.find((t) => t.slug === row.team_slug);
          if (club) setTheme(themeFromTeam(club.slug, club.meta));
        }
      }
    }
  }, [selectedSlug, mode, teams, players]);

  async function save() {
    if (!selectedSlug) return;
    setLoading(true);
    setMsg("");
    setMsgError(false);
    try {
      if (mode === "teams") {
        const row = teams.find((t) => t.slug === selectedSlug);
        if (!row) return;
        const meta = {
          ...row.meta,
          card_theme: theme,
          banner_url: bannerUrl || undefined,
        };
        const res = await fetch("/api/admin/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "team",
            row: { ...row, meta, profile: row.meta },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        setMsg(data.message || "Colores del club guardados");
      } else {
        const row = players.find((p) => p.slug === selectedSlug);
        if (!row) return;
        const meta = {
          ...row.meta,
          banner_url: bannerUrl || undefined,
        };
        const res = await fetch("/api/admin/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "player",
            row: {
              ...row,
              photo_url: photoUrl,
              meta,
              profile: meta,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        setMsg(data.message || "Foto y banner del jugador guardados");
      }
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }

  const teamRow = teams.find((t) => t.slug === selectedSlug);
  const playerRow = players.find((p) => p.slug === selectedSlug);
  const list = mode === "teams" ? teams : players;

  return (
    <StudioPanel
      title="Fondos de tarjetas y fotos"
      lead="Colores del watermark de cada club y fotos/banners de jugadores. Se ven en las cartas FUT y fichas."
      actions={
        <button type="button" className="bp-btn bp-btn-gold" onClick={save} disabled={loading || !selectedSlug}>
          <Save size={16} /> Guardar
        </button>
      }
    >
      <StudioToast message={msg} error={msgError} />

      <div className="bf-studio-cards-mode">
        <button
          type="button"
          className={mode === "teams" ? "is-on" : ""}
          onClick={() => {
            setMode("teams");
            if (teams[0]) setSelectedSlug(teams[0].slug);
          }}
        >
          Equipos ({teams.length})
        </button>
        <button
          type="button"
          className={mode === "players" ? "is-on" : ""}
          onClick={() => {
            setMode("players");
            if (players[0]) setSelectedSlug(players[0].slug);
          }}
        >
          Jugadores ({players.length})
        </button>
      </div>

      <div className="bf-admin-split bf-studio-cards-split">
        <aside className="bf-admin-sidebar">
          <input
            className="bf-admin-search"
            placeholder={mode === "teams" ? "Buscar club…" : "Buscar jugador…"}
            onChange={(e) => {
              const q = e.target.value.toLowerCase();
              const hit =
                mode === "teams"
                  ? teams.find((t) => t.slug.includes(q) || t.name.toLowerCase().includes(q))
                  : players.find((p) => p.slug.includes(q) || p.ign.toLowerCase().includes(q));
              if (hit) setSelectedSlug(hit.slug);
            }}
          />
          <ul className="bf-admin-list-scroll" style={{ maxHeight: 420 }}>
            {list.map((item) => {
              const slug = item.slug;
              const title = mode === "teams" ? (item as AdminTeamCatalogRow).name : (item as AdminPlayerCatalogRow).ign;
              return (
                <li key={slug}>
                  <button
                    type="button"
                    className={`bf-admin-list-card ${selectedSlug === slug ? "is-on" : ""}`}
                    onClick={() => setSelectedSlug(slug)}
                  >
                    {mode === "teams" ? (
                      <TeamLogo slug={slug} name={title} size={40} />
                    ) : (
                      <PlayerPhoto
                        playerSlug={slug}
                        teamSlug={(item as AdminPlayerCatalogRow).team_slug ?? undefined}
                        size={40}
                      />
                    )}
                    <span className="bf-admin-list-card-body">
                      <span className="bf-admin-list-card-title">{title}</span>
                      <span className="bf-admin-list-card-sub">{slug}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="bf-studio-cards-editor">
          {mode === "teams" && teamRow && (
            <>
              <MiniCardPreview
                label={teamRow.tag}
                theme={theme}
                logo={<TeamLogo slug={teamRow.slug} name={teamRow.name} size={56} />}
              />
              <div className="bf-studio-color-grid">
                <StudioColorPicker label="Color principal" value={theme.primary} onChange={(v) => setTheme({ ...theme, primary: v })} />
                <StudioColorPicker label="Fondo oscuro" value={theme.secondary} onChange={(v) => setTheme({ ...theme, secondary: v })} />
                <StudioColorPicker label="Brillo / glow" value={theme.glow} onChange={(v) => setTheme({ ...theme, glow: v })} />
              </div>
              <label className="bf-studio-field">
                <span className="bf-studio-field-label">Banner de ficha (URL)</span>
                <input
                  className="bf-studio-input"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
            </>
          )}
          {mode === "players" && playerRow && (
            <>
              <MiniCardPreview
                label={playerRow.ign}
                theme={theme}
                logo={
                  <PlayerPhoto
                    playerSlug={playerRow.slug}
                    teamSlug={playerRow.team_slug ?? undefined}
                    size={56}
                  />
                }
              />
              <p className="bf-studio-hint">
                El fondo de la carta usa los colores del club ({playerRow.team_slug || "sin equipo"}). Edítalos en la pestaña Equipos.
              </p>
              <label className="bf-studio-field">
                <span className="bf-studio-field-label">Foto del jugador (URL)</span>
                <input
                  className="bf-studio-input"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="bf-studio-field">
                <span className="bf-studio-field-label">Banner de perfil (URL)</span>
                <input
                  className="bf-studio-input"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      </div>
    </StudioPanel>
  );
}
