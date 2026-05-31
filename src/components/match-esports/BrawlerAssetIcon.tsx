"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban } from "lucide-react";
import type { MatchMeta } from "@/lib/data/match-meta";
import { brawlerImageFallbacks } from "@/lib/data/bs-catalog";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import { resolveBrawlerForMatch } from "@/lib/data/resolve-match-assets";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";

export function BrawlerAssetIcon({
  name,
  variant = "default",
  size = 72,
  onClick,
  selected,
  hideName,
  meta,
  disabled,
}: {
  name: string;
  variant?: "default" | "meta" | "ban" | "pick";
  size?: number;
  onClick?: () => void;
  selected?: boolean;
  hideName?: boolean;
  meta?: MatchMeta;
  disabled?: boolean;
}) {
  const { brawlers } = useGameAssetsCatalog();
  const def = resolveBrawlerForMatch(name, meta, brawlers);
  const candidates = useMemo(
    () => brawlerImageFallbacks(def.slug, def.imageUrl).map((u) => toClientLogoUrl(u)),
    [def.slug, def.imageUrl],
  );
  const [urlIndex, setUrlIndex] = useState(0);

  useEffect(() => {
    setUrlIndex(0);
  }, [def.slug, def.imageUrl, name]);

  const src = urlIndex < candidates.length ? candidates[urlIndex] : undefined;
  const Tag = onClick && !disabled ? "button" : "div";

  return (
    <Tag
      type={onClick && !disabled ? "button" : undefined}
      className={`bf-brawler-asset is-${variant} ${selected ? "is-on" : ""} ${disabled ? "is-disabled" : ""}`}
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
      {!hideName && (
        <span className="bf-brawler-asset-name">
          {def.name}
          {variant === "meta" && def.rarity && (
            <span className="bf-brawler-asset-rarity">{def.rarity}</span>
          )}
        </span>
      )}
    </Tag>
  );
}
