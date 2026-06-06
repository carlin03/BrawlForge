import type { EsportsMatch } from "@/lib/data/matches";
import type { ResolvedNavItem, ResolvedCmsConfig } from "./types";
import type { ResolvedHomePage } from "./resolve/home";

export type CmsRuntimePayload = {
  config: ResolvedCmsConfig;
  matchPool: EsportsMatch[];
  matchSource: string;
  home: ResolvedHomePage;
  navigation: ResolvedNavItem[];
};
