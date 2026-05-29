import type { CmsFeatureFlagKey } from "./types";
import { DEFAULT_FEATURE_FLAGS } from "./defaults";

export type FlagMap = Record<string, boolean>;

export function mergeFlags(dbFlags: FlagMap | null | undefined): FlagMap {
  return { ...DEFAULT_FEATURE_FLAGS, ...(dbFlags ?? {}) };
}

export function isFlagEnabled(flags: FlagMap, key: CmsFeatureFlagKey | string): boolean {
  return Boolean(flags[key]);
}

/** Master Strangler switch — cuando false, la web usa solo legacy. */
export function isCmsResolverActive(flags: FlagMap): boolean {
  return isFlagEnabled(flags, "cms.resolver.enabled");
}
