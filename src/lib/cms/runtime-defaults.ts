import type { CmsRuntimePayload } from "./runtime-types";
import { DEFAULT_LEGACY_CONFIG, DEFAULT_NAVIGATION } from "./defaults";

export const DEFAULT_CMS_HOME: CmsRuntimePayload["home"] = {
  enabled: false,
  sections: [],
  clubSlugs: [],
  matchLimits: { live: 8, upcoming: 8, results: 8 },
};

/** Arranque inmediato — se sustituye en cliente vía /api/cms/runtime */
export const DEFAULT_CMS_RUNTIME: CmsRuntimePayload = {
  config: DEFAULT_LEGACY_CONFIG,
  matchPool: [],
  matchSource: "legacy",
  home: DEFAULT_CMS_HOME,
  navigation: DEFAULT_NAVIGATION,
};
