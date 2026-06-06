import { resolveCmsConfig, resolveHomePage, resolveMatchList } from "./resolve";
import type { CmsRuntimePayload } from "./runtime-types";

export type { CmsRuntimePayload } from "./runtime-types";
export { DEFAULT_CMS_RUNTIME, DEFAULT_CMS_HOME } from "./runtime-defaults";

/** Solo config + home — rápido para arranque (sin partidos). */
export async function loadCmsRuntimeLite(): Promise<CmsRuntimePayload> {
  const [config, home] = await Promise.all([resolveCmsConfig(), resolveHomePage()]);
  return {
    config,
    matchPool: [],
    matchSource: "legacy",
    home,
    navigation: config.navigation,
  };
}

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
