"use client";

import { useMemo, useState } from "react";
import { Ban } from "lucide-react";
import { resolveBrawlerDef } from "@/lib/data/game-assets-catalog";
import { brawlerImageFallbacks } from "@/lib/data/bs-catalog";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";

export function BrawlerAssetIcon({
  name,
  variant = "default",
  size = 72,
  onClick,
  selected,
  hideName,
}: {
  name: string;
  variant?: "default" | "meta" | "ban" | "pick";
  size?: number;
  onClick?: () => void;
  selected?: boolean;
  hideName?: boolean;
}) {
  const { brawlers } = useGameAssetsCatalog();
  const def = resolveBrawlerDef(name, brawlers);
  const candidates = useMemo(
    () => brawlerImageFallbacks(def.slug, def.imageUrl).map((u) => toClientLogoUrl(u)),
    [def.slug, def.imageUrl],
  );
  const [urlIndex, setUrlIndex] = useState(0);
  const src = urlIndex < candidates.length ? candidates[urlIndex] : undefined;
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
          <img
            src={src}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            onError={() => setUrlIndex((i) => i + 1)}
          />
        ) : (
          <span className="bf-brawler-asset-fallback">{def.name.slice(0, 1)}</span>
        )}
        {variant === "ban" && (
          <span className="bf-brawler-asset-ban" aria-hidden>
            <Ban size={18} />
          </span>
        )}
      </span>
      {!hideName && <span className="bf-brawler-asset-name">{def.name}</span>}
    </Tag>
  );
}
