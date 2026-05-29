"use client";

import { CardWatermarkImage } from "@/components/ui/CardWatermarkImage";
import { TeamCardWatermark } from "@/components/ui/TeamCardWatermark";
import { getWatermarkScale, type CardWatermarkConfig } from "@/lib/data/card-theme-meta";

export function CardWatermarkLayer({
  teamSlug,
  teamName,
  cardSize = "md",
  config,
}: {
  teamSlug: string;
  teamName: string;
  cardSize?: "hero" | "xl" | "lg" | "md" | "sm" | "mini";
  config?: CardWatermarkConfig;
}) {
  const wm = config ?? { opacity: 48, scale: 100 };
  const scalePct = getWatermarkScale(wm);
  const opacityPct = wm.opacity ?? 48;
  const opacity = Math.min(1, Math.max(0, opacityPct / 100));
  const customUrl = wm.image_url?.trim();
  const showBehind = wm.show_team_logo_behind !== false && customUrl;
  const cardSizeClass =
    cardSize === "mini"
      ? ""
      : cardSize
        ? `bf-card-team-watermark--${cardSize}`
        : "bf-card-team-watermark--md";

  const layerStyle = {
    ["--bf-card-watermark-img-opacity" as string]: String(opacity),
    ["--bf-card-watermark-scale" as string]: String(scalePct / 100),
  } as React.CSSProperties;

  return (
    <div
      className={`bf-card-team-watermark ${cardSizeClass} ${cardSize === "mini" ? "is-mini" : ""} ${customUrl ? "has-custom-img" : ""}`.trim()}
      style={layerStyle}
    >
      {showBehind && (
        <div className="bf-card-watermark-behind" style={{ opacity: opacity * 0.35 }} aria-hidden>
          <TeamCardWatermark slug={teamSlug} name={teamName} />
        </div>
      )}
      {customUrl ? (
        <CardWatermarkImage
          url={customUrl}
          className="bf-card-watermark-img bf-card-watermark-custom"
        />
      ) : (
        <TeamCardWatermark slug={teamSlug} name={teamName} className="bf-card-watermark-img" />
      )}
    </div>
  );
}
