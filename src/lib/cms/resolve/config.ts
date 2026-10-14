import {
  loadFlagsFromDb,
  loadModulesFromDb,
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
import type { ResolvedCmsConfig, ResolvedThemeTokens } from "../types";

/**
 * CMS: settings/theme sí; navegación pública fijada al Mundial (MAIN_NAV).
 */
export async function resolveCmsConfig(): Promise<ResolvedCmsConfig> {
  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  const resolverOn = isCmsResolverActive(flags);

  let source: ResolvedCmsConfig["source"] = "legacy";
  const base = { ...DEFAULT_LEGACY_CONFIG, flags, version: CMS_CONFIG_VERSION };

  if (!resolverOn) {
    return {
      ...base,
      source: "legacy",
      navigation: DEFAULT_NAVIGATION,
      modules: (await loadModulesFromDb()) ?? [],
    };
  }

  source = dbFlags ? "supabase" : "legacy";

  const settingsDb = await loadSettingsFromDb();
  const settings = {
    branding: { ...base.settings.branding, ...settingsDb?.branding },
    seo: {
      ...base.settings.seo,
      ...settingsDb?.seo,
      title: "Brawl Stars World Finals 2026 · Tokio",
      description: "Pick'ems, equipos y jugadores del Mundial de Brawl Stars en Japón.",
    },
    cardWatermark: settingsDb?.cardWatermark ?? base.settings.cardWatermark,
  };

  // Nav pública siempre = Mundial (ignora menú CMS viejo)
  const navigation = DEFAULT_NAVIGATION;

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
