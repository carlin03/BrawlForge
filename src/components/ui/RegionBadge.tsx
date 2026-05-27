import type { Region } from "@/lib/types";

const REGION_BADGE: Record<Region, string> = {
  GLOBAL: "bf-badge-yellow",
  EMEA: "bf-badge-blue",
  NA: "bf-badge-red",
  SA: "bf-badge-red",
  EA: "bf-badge-blue",
  SEA: "bf-badge-yellow",
};

interface RegionBadgeProps {
  region: Region;
  className?: string;
}

export function RegionBadge({ region, className = "" }: RegionBadgeProps) {
  return (
    <span className={`bf-badge ${REGION_BADGE[region]} ${className}`}>
      {region}
    </span>
  );
}
