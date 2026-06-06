"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const AppInner = dynamic(() => import("@/components/layout/AppInner"), {
  ssr: false,
  loading: () => <div id="bf-app-placeholder" aria-hidden style={{ minHeight: "100vh" }} />,
});

export function DeferredApp({ children }: { children: ReactNode }) {
  return <AppInner>{children}</AppInner>;
}
