"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { getBrawlerDef } from "@/lib/data/bs-catalog";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";

export function BrawlerAssetIcon({
  name,
  variant = "default",
  size = 72,
  onClick,
  selected,
}: {
  name: string;
  variant?: "default" | "meta" | "ban" | "pick";
  size?: number;
  onClick?: () => void;
  selected?: boolean;
}) {
  const def = getBrawlerDef(name);
  const [failed, setFailed] = useState(false);
  const src = failed ? undefined : toClientLogoUrl(def.imageUrl);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`bf-brawler-asset is-${variant} ${selected ? "is-on" : ""}`}
      style={{ width: size, minWidth: size }}
      onClick={onClick}
      title={def.name}
    >
      <span className="bf-brawler-asset-ring" style={{ width: size, height: size }}>
        {src ? (
          <img src={src} alt="" width={size} height={size} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <span className="bf-brawler-asset-fallback">{def.name.slice(0, 1)}</span>
        )}
        {variant === "ban" && (
          <span className="bf-brawler-asset-ban" aria-hidden>
            <Ban size={18} />
          </span>
        )}
      </span>
      <span className="bf-brawler-asset-name">{def.name}</span>
    </Tag>
  );
}
