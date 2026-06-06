"use client";

import { useEffect } from "react";
import { themeTokensToCssVars } from "@/lib/cms/theme-css";

/** Tema CMS en cliente — no bloquea el HTML inicial. */
export function CmsThemeClient() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/cms/runtime", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.config?.theme) return;
        const flags = data.config.flags ?? {};
        if (!flags["cms.theme.enabled"]) return;
        const css = themeTokensToCssVars(data.config.theme);
        let el = document.getElementById("cms-theme-vars");
        if (!el) {
          el = document.createElement("style");
          el.id = "cms-theme-vars";
          document.head.appendChild(el);
        }
        el.textContent = css;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
