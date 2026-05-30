"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { resolveMapDef } from "@/lib/data/game-assets-catalog";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";

export function MapAssetCard({
  name,
  variant = "pool",
  index,
  isCurrent,
  isDecisive,
  size,
}: {
  name: string;
  variant?: "pool" | "order" | "ban";
  index?: number;
  isCurrent?: boolean;
  isDecisive?: boolean;
  size?: "md" | "lg";
}) {
  const { maps } = useGameAssetsCatalog();
  const def = resolveMapDef(name, maps);
  const [failed, setFailed] = useState(false);
  const src = failed ? undefined : toClientLogoUrl(def.imageUrl);

  return (
    <article
      className={`bf-map-asset ${variant === "ban" ? "is-banned" : ""} ${isCurrent ? "is-current" : ""} ${isDecisive ? "is-decisive" : ""} ${size === "lg" ? "is-lg" : ""}`}
    >
      <div className="bf-map-asset-art">
        {src ? (
          <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <span className="bf-map-asset-fallback" aria-hidden>
            {def.name.slice(0, 2)}
          </span>
        )}
        {variant === "ban" && (
          <span className="bf-map-asset-ban-overlay" aria-hidden>
            <Ban size={28} />
          </span>
        )}
        {typeof index === "number" && variant === "order" && (
          <span className="bf-map-asset-index">Mapa {index + 1}</span>
        )}
      </div>
      <div className="bf-map-asset-meta">
        <strong>{def.name}</strong>
        <span>{def.mode}</span>
      </div>
      {isCurrent && <span className="bf-map-asset-tag">En juego</span>}
      {isDecisive && <span className="bf-map-asset-tag is-gold">Decisivo</span>}
    </article>
  );
}
