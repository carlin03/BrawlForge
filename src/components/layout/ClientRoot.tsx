"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/AppShell";
import { CmsRuntimeBootstrap } from "@/components/cms/CmsRuntimeBootstrap";

/**
 * Monta providers y shell tras el primer frame para no bloquear el loader HTML.
 */
export function ClientRoot({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div id="bf-app-placeholder" aria-hidden style={{ minHeight: "100vh" }} />;
  }

  return (
    <CmsRuntimeBootstrap>
      <Providers>
        <AppShell>{children}</AppShell>
      </Providers>
    </CmsRuntimeBootstrap>
  );
}
