"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Users } from "lucide-react";
import { AdminCardFUTPreview } from "./AdminCardFUTPreview";
import { CardWatermarkImage } from "@/components/ui/CardWatermarkImage";
import { StudioColorPicker, StudioPanel, StudioToast } from "./studio-ui";
import { AdminPlayerTeamPicker } from "@/components/admin/AdminPlayerTeamPicker";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import {
  getCardWatermarkFromMeta,
  mergeCardWatermarks,
  mergeCardWatermarkIntoMeta,
  parseCardThemeMeta,
  parseCardWatermark,
  type CardThemeMeta,
  getWatermarkScale,
  type CardWatermarkConfig,
  watermarkForPlayerSync,
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

function watermarkFromPlayerMeta(meta: Record<string, unknown>): CardWatermarkConfig {
  return getCardWatermarkFromMeta(meta) ?? parseCardWatermark(null);
}

function WatermarkFields({
  watermark,
  onChange,
  hint,
}: {
  watermark: CardWatermarkConfig;
  onChange: (wm: CardWatermarkConfig) => void;
  hint?: string;
}) {
  const patch = (partial: Partial<CardWatermarkConfig>) =>
    onChange({ ...parseCardWatermark(watermark), ...partial });

  return (
    <div className="bf-studio-watermark-block">
      <h4 className="bf-studio-watermark-title">Marca de fondo (entre fondo y foto)</h4>
      <p className="bf-studio-hint">
        {hint ??
          "PNG o escudo del club. Se ve detrás de la foto del jugador para identificar el equipo."}
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
      <label className="bf-studio-field">
        <span className="bf-studio-field-label">
          Tamaño: <strong>{getWatermarkScale(watermark)}%</strong> (0 = oculto)
        </span>
        <input
          type="range"
          min={0}
          max={300}
          value={getWatermarkScale(watermark)}
          onChange={(e) => patch({ scale: Number(e.target.value) })}
          className="bf-studio-range"
        />
      </label>
      {watermark.image_url?.trim() && (
        <>
          <div className="bf-studio-wm-url-preview">
            <span className="bf-studio-field-label">Carga de imagen</span>
            <CardWatermarkImage
              url={watermark.image_url}
              className="bf-studio-wm-url-preview-img"
            />
          </div>
          <label className="bf-studio-check">
            <input
              type="checkbox"
              checked={watermark.show_team_logo_behind !== false}
              onChange={(e) => patch({ show_team_logo_behind: e.target.checked })}
            />
            <span>Mostrar logo del club muy suave detrás del PNG</span>
          </label>
        </>
      )}
    </div>
  );
}

async function upsertPlayerRow(
  row: AdminPlayerCatalogRow,
  patch: { photo_url?: string; meta: Record<string, unknown>; team_slug?: string | null },
) {
  const res = await fetch("/api/admin/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity: "player",
      row: {
        ...row,
        photo_url: patch.photo_url ?? row.photo_url,
        team_slug: patch.team_slug !== undefined ? patch.team_slug : row.team_slug,
        meta: patch.meta,
        profile: patch.meta,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al guardar jugador");
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
  const [playerWatermark, setPlayerWatermark] = useState<CardWatermarkConfig>(parseCardWatermark(null));
  const [playerTeamSlug, setPlayerTeamSlug] = useState<string | null>(null);
  const [applyToRoster, setApplyToRoster] = useState(true);
  const [syncRosterImage, setSyncRosterImage] = useState(true);
  const [syncRosterStyle, setSyncRosterStyle] = useState(true);
  const [copyClubImage, setCopyClubImage] = useState(true);
  const [copyClubStyle, setCopyClubStyle] = useState(true);
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
      setSelectedSlug((cur) => {
        if (cur && (t.some((x) => x.slug === cur) || p.some((x) => x.slug === cur))) return cur;
        if (mode === "players" && p[0]?.slug) return p[0].slug;
        if (t[0]?.slug) return t[0].slug;
        return "";
      });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }, [mode]);

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
      return;
    }
    const row = players.find((p) => p.slug === selectedSlug);
    if (!row) return;
    setPhotoUrl(row.photo_url ?? "");
    setBannerUrl(String(row.meta?.banner_url ?? ""));
    setPlayerWatermark(watermarkFromPlayerMeta(row.meta));
    setPlayerTeamSlug(row.team_slug ?? null);
    const club = row.team_slug ? teams.find((t) => t.slug === row.team_slug) : null;
    if (club) setTheme(themeFromTeam(club.slug, club.meta));
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

        let rosterMsg = "";
        if (applyToRoster && theme.watermark) {
          const roster = players.filter((p) => p.team_slug === selectedSlug);
          let synced = 0;
          for (const p of roster) {
            const pMeta = mergeCardWatermarkIntoMeta({ ...p.meta }, theme.watermark);
            await upsertPlayerRow(p, { meta: pMeta });
            synced += 1;
          }
          rosterMsg = synced > 0 ? ` · ${synced} jugadores con la misma marca` : "";
        }
        setMsg((data.message || "Colores y marca del club guardados") + rosterMsg);
      } else {
        const row = players.find((p) => p.slug === selectedSlug);
        if (!row) return;
        let meta: Record<string, unknown> = {
          ...row.meta,
          banner_url: bannerUrl || undefined,
        };
        meta = mergeCardWatermarkIntoMeta(meta, playerWatermark);
        await upsertPlayerRow(row, {
          photo_url: photoUrl,
          meta,
          team_slug: playerTeamSlug,
        });
        setPlayers((prev) =>
          prev.map((p) =>
            p.slug === selectedSlug
              ? { ...p, photo_url: photoUrl, team_slug: playerTeamSlug, meta }
              : p,
          ),
        );
        setMsg("Foto, club, marca y banner del jugador guardados");
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
      : playerTeamSlug
        ? teams.find((t) => t.slug === playerTeamSlug)
        : undefined;

  const rosterCount =
    mode === "teams" && teamRow
      ? players.filter((p) => p.team_slug === teamRow.slug).length
      : 0;

  const previewTheme: CardThemeMeta | null =
    mode === "teams" && teamRow
      ? theme
      : previewClub
        ? {
            ...themeFromTeam(previewClub.slug, previewClub.meta),
            watermark: mergeCardWatermarks(
              themeFromTeam(previewClub.slug, previewClub.meta).watermark,
              playerWatermark,
            ),
          }
        : null;

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

        <div className="bf-studio-cards-editor" key={`${mode}-${selectedSlug}`}>
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
              <div className="bf-studio-sync-roster-block">
                <label className="bf-studio-check bf-studio-sync-roster">
                  <input
                    type="checkbox"
                    checked={applyToRoster}
                    onChange={(e) => setApplyToRoster(e.target.checked)}
                  />
                  <span>
                    <Users size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                    Al guardar, aplicar a toda la plantilla
                    {rosterCount > 0 ? ` (${rosterCount} jugadores)` : ""}
                  </span>
                </label>
                {applyToRoster && (
                  <div className="bf-studio-sync-roster-sub">
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={syncRosterStyle}
                        onChange={(e) => setSyncRosterStyle(e.target.checked)}
                      />
                      <span>Copiar opacidad y tamaño (los colores ya son del club)</span>
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={syncRosterImage}
                        onChange={(e) => setSyncRosterImage(e.target.checked)}
                      />
                      <span>Copiar URL de la imagen PNG a cada jugador</span>
                    </label>
                  </div>
                )}
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
              <div className="bf-studio-field">
                <span className="bf-studio-field-label">Club del jugador</span>
                <AdminPlayerTeamPicker
                  key={selectedSlug}
                  teams={teams.map((t) => ({ slug: t.slug, name: t.name, tag: t.tag, region: t.region }))}
                  value={playerTeamSlug}
                  onChange={(slug) => {
                    setPlayerTeamSlug(slug);
                    const club = slug ? teams.find((t) => t.slug === slug) : null;
                    if (club) setTheme(themeFromTeam(club.slug, club.meta));
                  }}
                  compact
                />
              </div>
            </>
          )}
          {mode === "players" && playerRow && previewClub && previewTheme && (
            <>
              <AdminCardFUTPreview
                theme={previewTheme}
                teamSlug={previewClub.slug}
                teamName={previewClub.name}
                teamTag={previewClub.tag}
                playerIgn={playerRow.ign}
                playerSlug={playerRow.slug}
                photoUrl={photoUrl}
                mode="player"
              />
              <p className="bf-studio-hint">
                Fondo y colores del club ({previewClub.slug}). Edítalos en la pestaña Equipos.
              </p>
              <WatermarkFields
                watermark={playerWatermark}
                onChange={setPlayerWatermark}
                hint="Marca solo para este jugador. Si dejas la URL vacía, usa la del club. La opacidad y el tamaño sí se pueden ajustar aquí."
              />
              {previewClub && (
                <div className="bf-studio-copy-club-block">
                  <p className="bf-studio-field-label">Copiar desde el club</p>
                  <label className="bf-studio-check">
                    <input
                      type="checkbox"
                      checked={copyClubStyle}
                      onChange={(e) => setCopyClubStyle(e.target.checked)}
                    />
                    <span>Opacidad y tamaño del club</span>
                  </label>
                  <label className="bf-studio-check">
                    <input
                      type="checkbox"
                      checked={copyClubImage}
                      onChange={(e) => setCopyClubImage(e.target.checked)}
                    />
                    <span>Imagen PNG del club</span>
                  </label>
                  <button
                    type="button"
                    className="bp-btn bp-btn-ghost"
                    disabled={!copyClubImage && !copyClubStyle}
                    onClick={() => {
                      const clubWm = themeFromTeam(previewClub.slug, previewClub.meta).watermark;
                      const fromClub = watermarkForPlayerSync(clubWm, {
                        includeImage: copyClubImage,
                        includeStyle: copyClubStyle,
                      });
                      const base = parseCardWatermark(playerWatermark);
                      const merged = { ...base, ...fromClub };
                      if (!copyClubImage) merged.image_url = undefined;
                      setPlayerWatermark(parseCardWatermark(merged));
                    }}
                  >
                    Aplicar selección del club
                  </button>
                </div>
              )}
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
            <p className="bf-studio-hint">
              Asigna un club arriba para ver la vista previa de carta con sus colores y marca.
            </p>
          )}
        </div>
      </div>
    </StudioPanel>
  );
}
