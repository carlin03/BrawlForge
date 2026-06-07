"use client";



import type { ReactNode } from "react";

import { Providers } from "@/app/providers";

import { AppShell } from "@/components/layout/AppShell";

import { CmsRuntimeBootstrap } from "@/components/cms/CmsRuntimeBootstrap";

import { CmsThemeClient } from "@/components/cms/CmsThemeClient";

import { BackgroundPrefetch } from "@/components/layout/BackgroundPrefetch";



export default function AppInner({ children }: { children: ReactNode }) {

  return (

    <>

      <BackgroundPrefetch />

      <CmsThemeClient />

      <CmsRuntimeBootstrap>

        <Providers>

          <AppShell>{children}</AppShell>

        </Providers>

      </CmsRuntimeBootstrap>

    </>

  );

}

