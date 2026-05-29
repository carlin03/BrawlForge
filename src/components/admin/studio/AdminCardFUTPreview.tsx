"use client";

import { CardWatermarkLayer } from "@/components/ui/CardWatermarkLayer";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  cardThemeToTeamTheme,
  parseCardWatermark,
  type CardThemeMeta,
} from "@/lib/data/card-theme-meta";
import { teamCardThemeVars } from "@/lib/data/team-card-theme";

export function AdminCardFUTPreview({
  theme,
  teamSlug,
  teamName,
  teamTag,
  playerIgn,
  playerSlug,
  photoUrl,
  mode = "player",
}: {
  theme: CardThemeMeta;
  teamSlug: string;
  teamName: string;
  teamTag?: string;
  playerIgn?: string;
  playerSlug?: string;
  /** URL en vivo del campo (antes de guardar) */
  photoUrl?: string;
  mode?: "team" | "player";
}) {
  const wm = theme.watermark ?? parseCardWatermark(null);
  const themeStyle = teamCardThemeVars(cardThemeToTeamTheme(theme), "md", wm) as React.CSSProperties;
  const label = mode === "player" ? (playerIgn ?? "Jugador") : (teamTag ?? teamName);

  return (
    <div className="bf-admin-fut-preview-wrap">
      <p className="bf-studio-hint bf-admin-fut-preview-label">Vista previa de la carta</p>
      <div
        className="bf-card bf-card-fut bf-card-premium has-team-theme bf-card-md bf-admin-fut-preview"
        style={themeStyle}
        data-team={teamSlug}
      >
        <div className="bf-card-team-bg" aria-hidden>
          <div className="bf-card-team-glow" />
          <CardWatermarkLayer teamSlug={teamSlug} teamName={teamName} cardSize="md" config={wm} />
        </div>
        <div className="bf-card-shine" aria-hidden />
        <div className="bf-card-fut-head">
          <span className="bf-card-ovr">88</span>
          <div className="bf-card-fut-badges">
            <span className="bf-card-role-pill">MID</span>
          </div>
        </div>
        <div className="bf-card-logo-stage">
          {mode === "player" && photoUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl.trim()}
              alt=""
              className="bf-admin-fut-preview-photo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0.35";
              }}
            />
          ) : mode === "player" && playerSlug ? (
            <PlayerPhoto
              playerSlug={playerSlug}
              teamSlug={teamSlug}
              name={playerIgn}
              size={56}
            />
          ) : (
            <TeamLogo slug={teamSlug} name={teamName} size={56} />
          )}
        </div>
        <div className="bf-card-identity">
          <div className="bf-card-name">{label}</div>
          <div className="bf-card-team">{teamName}</div>
        </div>
        <div className="bf-card-fut-foot">
          <div className="bf-card-fut-stat">
            <strong>1.12</strong>
            <span>Rating</span>
          </div>
          <div className="bf-card-fut-stat">
            <strong>42%</strong>
            <span>Own</span>
          </div>
          <div className="bf-card-fut-stat">
            <strong>88</strong>
            <span>Pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
