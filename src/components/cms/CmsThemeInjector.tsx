import { isFlagEnabled, resolveCmsConfig, themeTokensToCssVars } from "@/lib/cms";

/**
 * Inyecta variables CSS solo si cms.theme.enabled está activo.
 * Por defecto no renderiza nada → la web se ve igual.
 */
export async function CmsThemeInjector() {
  const config = await resolveCmsConfig();
  if (!isFlagEnabled(config.flags, "cms.theme.enabled")) return null;
  const css = themeTokensToCssVars(config.theme);
  return <style id="cms-theme-vars" dangerouslySetInnerHTML={{ __html: css }} />;
}
