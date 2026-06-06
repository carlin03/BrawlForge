"use client";

import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/AppShell";
import { CmsRuntimeBootstrap } from "@/components/cms/CmsRuntimeBootstrap";
import { CmsThemeClient } from "@/components/cms/CmsThemeClient";

/** App completa — chunk aparte, no bloquea el HTML inicial. */
export default function AppInner({ children }: { children: ReactNode }) {
  return (
    <>
      <CmsThemeClient />
      <CmsRuntimeBootstrap>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </CmsRuntimeBootstrap>
    </>
  );
}
