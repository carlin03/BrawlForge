"use client";

import { TeamCardWatermark } from "@/components/ui/TeamCardWatermark";
import type { CardWatermarkConfig, CardWatermarkSize } from "@/lib/data/card-theme-meta";

const SCALE_CLASS: Record<CardWatermarkSize, string> = {
  sm: "bf-card-watermark-scale-sm",
  md: "bf-card-watermark-scale-md",
  lg: "bf-card-watermark-scale-lg",
};

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
  const wm = config ?? { opacity: 48, size: "md" };
  const scaleClass = SCALE_CLASS[wm.size ?? "md"];
  const opacity = (wm.opacity ?? 48) / 100;
  const customUrl = wm.image_url?.trim();
  const showBehind = wm.show_team_logo_behind !== false && customUrl;
  const cardSizeClass =
    cardSize === "mini"
      ? ""
      : cardSize
        ? `bf-card-team-watermark--${cardSize}`
        : "bf-card-team-watermark--md";

  return (
    <div
      className={`bf-card-team-watermark ${cardSizeClass} ${scaleClass} ${cardSize === "mini" ? "is-mini" : ""}`.trim()}
    >
      {showBehind && (
        <div className="bf-card-watermark-behind" style={{ opacity: opacity * 0.35 }} aria-hidden>
          <TeamCardWatermark slug={teamSlug} name={teamName} />
        </div>
      )}
      {customUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={customUrl}
          alt=""
          aria-hidden
          className="bf-card-watermark-img bf-card-watermark-custom"
          style={{ opacity }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <TeamCardWatermark slug={teamSlug} name={teamName} className="bf-card-watermark-img" />
      )}
    </div>
  );
}
