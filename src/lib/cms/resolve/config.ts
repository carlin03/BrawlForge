import {
  loadFlagsFromDb,
  loadModulesFromDb,
  loadNavigationFromDb,
  loadSettingsFromDb,
  loadThemeFromDb,
} from "../db";
import {
  CMS_CONFIG_VERSION,
  DEFAULT_LEGACY_CONFIG,
  DEFAULT_NAVIGATION,
  DEFAULT_THEME_TOKENS,
} from "../defaults";
import { isCmsResolverActive, isFlagEnabled, mergeFlags } from "../flags";
import type { ResolvedCmsConfig, ResolvedNavItem, ResolvedThemeTokens } from "../types";

/**
 * Resuelve configuración pública del CMS.
 * Con flags desactivados (por defecto) devuelve exactamente el comportamiento legacy.
 */
export async function resolveCmsConfig(): Promise<ResolvedCmsConfig> {
  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  const resolverOn = isCmsResolverActive(flags);

  let source: ResolvedCmsConfig["source"] = "legacy";
  const base = { ...DEFAULT_LEGACY_CONFIG, flags, version: CMS_CONFIG_VERSION };

  if (!resolverOn) {
    return { ...base, source: "legacy", modules: (await loadModulesFromDb()) ?? [] };
  }

  source = dbFlags ? "supabase" : "legacy";

  const settingsDb = await loadSettingsFromDb();
  const settings = {
    branding: { ...base.settings.branding, ...settingsDb?.branding },
    seo: { ...base.settings.seo, ...settingsDb?.seo },
  };

  let navigation: ResolvedNavItem[] = DEFAULT_NAVIGATION;
  if (isFlagEnabled(flags, "cms.nav.enabled")) {
    navigation = (await loadNavigationFromDb()) ?? DEFAULT_NAVIGATION;
  }

  let theme: ResolvedThemeTokens = DEFAULT_THEME_TOKENS;
  if (isFlagEnabled(flags, "cms.theme.enabled")) {
    theme = (await loadThemeFromDb()) ?? DEFAULT_THEME_TOKENS;
  }

  const modules = (await loadModulesFromDb()) ?? [];

  if (settingsDb || dbFlags) source = "hybrid";

  return {
    version: CMS_CONFIG_VERSION,
    source,
    flags,
    settings,
    navigation,
    theme,
    modules,
  };
}
