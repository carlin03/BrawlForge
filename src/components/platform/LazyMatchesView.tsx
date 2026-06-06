"use client";

import dynamic from "next/dynamic";
import { PageLoadShell } from "@/components/platform/PageLoadShell";

const MatchesView = dynamic(
  () => import("@/components/platform/MatchesView").then((m) => m.MatchesView),
  { ssr: false, loading: () => <PageLoadShell label="Cargando partidos…" /> },
);

export function LazyMatchesView() {
  return <MatchesView />;
}
