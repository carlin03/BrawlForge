import type { Region } from "@/lib/types";

const REGION_LABELS: Record<Region, string> = {
  EA: "East Asia",
  EMEA: "EMEA",
  NA: "Norteamérica",
  SA: "Sudamérica",
  GLOBAL: "Global",
  SEA: "Southeast Asia",
};

export function regionLabel(region: Region): string {
  return REGION_LABELS[region] ?? region;
}

export const TEAM_REGIONS = ["EMEA", "EA", "NA", "SA"] as const;
