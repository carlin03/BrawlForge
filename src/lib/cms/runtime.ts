import type { EsportsMatch } from "@/lib/data/matches";
import type { ResolvedNavItem, ResolvedCmsConfig } from "./types";
import { resolveCmsConfig, resolveHomePage, resolveMatchList } from "./resolve";
import type { ResolvedHomePage } from "./resolve/home";

export type CmsRuntimePayload = {
  config: ResolvedCmsConfig;
  matchPool: EsportsMatch[];
  matchSource: string;
  home: ResolvedHomePage;
  navigation: ResolvedNavItem[];
};

export async function loadCmsRuntime(): Promise<CmsRuntimePayload> {
  const [config, matchRes, home] = await Promise.all([
    resolveCmsConfig(),
    resolveMatchList(),
    resolveHomePage(),
  ]);

  return {
    config,
    matchPool: matchRes.pool,
    matchSource: matchRes.source,
    home,
    navigation: config.navigation,
  };
}
