"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AdminCardFUTPreview } from "./AdminCardFUTPreview";
import { StudioColorPicker, StudioPanel, StudioToast } from "./studio-ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import {
  parseCardThemeMeta,
  parseCardWatermark,
  type CardThemeMeta,
  type CardWatermarkConfig,
  type CardWatermarkSize,
} from "@/lib/data/card-theme-meta";
import { getTeamCardTheme } from "@/lib/data/team-card-theme";
import { mergeAdminTeamRows } from "@/lib/data/admin-bsc-teams";
import { mergeAdminPlayerRows } from "@/lib/data/admin-bsc-players";
import type { AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";
import type { AdminPlayerCatalogRow } from "@/lib/data/admin-catalog-fields";

function themeFromTeam(slug: string, meta: Record<string, unknown>): CardThemeMeta {
  const parsed = parseCardThemeMeta(meta);
  const t = getTeamCardTheme(slug);
  const base: CardThemeMeta = {
    primary: parsed?.primary ?? t.primary,
    secondary: parsed?.secondary ?? t.secondary,
    glow: parsed?.glow ?? t.glow,
    watermark: parsed?.watermark ?? parseCardWatermark(null),
  };
  return base;
}

function WatermarkFields({
  watermark,
  onChange,
}: {
  watermark: CardWatermarkConfig;
  onChange: (wm: CardWatermarkConfig) => void;
}) {
  const patch = (partial: Partial<CardWatermarkConfig>) =>
    onChange({ ...parseCardWatermark(watermark), ...partial });

  return (
    <div className="bf-studio-watermark-block">
      <h4 className="bf-studio-watermark-title">Marca de fondo (entre fondo y foto)</h4>
      <p className="bf-studio-hint">
        PNG o escudo del club. Se ve detrás de la foto del jugador para identificar el equipo.
      </p>
      <label className="bf-studio-field">
        <span className="bf-studio-field-label">Imagen PNG / URL</span>
        <input
          className="bf-studio-input"
          value={watermark.image_url ?? ""}
          onChange={(e) => patch({ image_url: e.target.value || undefined })}
          placeholder="https://… (vacío = logo del club)"
        />
      </label>
      <label className="bf-studio-field">
        <span className="bf-studio-field-label">
          Opacidad: <strong>{watermark.opacity ?? 48}%</strong>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={watermark.opacity ?? 48}
          onChange={(e) => patch({ opacity: Number(e.target.value) })}
          className="bf-studio-range"
        />
      </label>
      <div className="bf-studio-field">
        <span className="bf-studio-field-label">Tamaño de la marca</span>
        <div className="bf-studio-watermark-sizes">
          {(["sm", "md", "lg"] as CardWatermarkSize[]).map((s) => (
            <button
              key={s}
              type="button"
              className={(watermark.size ?? "md") === s ? "is-on" : ""}
              onClick={() => patch({ size: s })}
            >
              {s === "sm" ? "Pequeño" : s === "lg" ? "Grande" : "Mediano"}
            </button>
          ))}
        </div>
      </div>
      {watermark.image_url?.trim() && (
        <label className="bf-studio-check">
          <input
            type="checkbox"
            checked={watermark.show_team_logo_behind !== false}
            onChange={(e) => patch({ show_team_logo_behind: e.target.checked })}
          />
          <span>Mostrar logo del club muy suave detrás del PNG</span>
        </label>
      )}
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
    watermark: parseCardWatermark(null),
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
  }, [selectedSlug]);

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
        setMsg(data.message || "Colores y marca del club guardados");
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
  const previewClub =
    mode === "teams"
      ? teamRow
      : playerRow?.team_slug
        ? teams.find((t) => t.slug === playerRow.team_slug)
        : undefined;

  return (
    <StudioPanel
      title="Fondos de tarjetas y fotos"
      lead="Colores y marca de fondo de cada club; fotos de jugadores con vista previa en vertical."
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
              <AdminCardFUTPreview
                theme={theme}
                teamSlug={teamRow.slug}
                teamName={teamRow.name}
                teamTag={teamRow.tag}
                mode="team"
              />
              <div className="bf-studio-color-grid">
                <StudioColorPicker label="Color principal" value={theme.primary} onChange={(v) => setTheme({ ...theme, primary: v })} />
                <StudioColorPicker label="Fondo oscuro" value={theme.secondary} onChange={(v) => setTheme({ ...theme, secondary: v })} />
                <StudioColorPicker label="Brillo / glow" value={theme.glow} onChange={(v) => setTheme({ ...theme, glow: v })} />
              </div>
              <WatermarkFields
                watermark={theme.watermark ?? parseCardWatermark(null)}
                onChange={(watermark) => setTheme({ ...theme, watermark })}
              />
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
          {mode === "players" && playerRow && previewClub && (
            <>
              <AdminCardFUTPreview
                theme={theme}
                teamSlug={previewClub.slug}
                teamName={previewClub.name}
                teamTag={previewClub.tag}
                playerIgn={playerRow.ign}
                playerSlug={playerRow.slug}
                photoUrl={photoUrl}
                mode="player"
              />
              <p className="bf-studio-hint">
                Fondo y marca del club ({previewClub.slug}). Colores y PNG en la pestaña Equipos.
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
          {mode === "players" && playerRow && !previewClub && (
            <p className="bf-studio-hint">Este jugador no tiene equipo asignado; no hay vista previa de carta.</p>
          )}
        </div>
      </div>
    </StudioPanel>
  );
}
