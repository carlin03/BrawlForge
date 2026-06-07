"use client";

import dynamic from "next/dynamic";
import { PageLoadShell } from "@/components/platform/PageLoadShell";

const EsportView = dynamic(
  () => import("@/components/platform/EsportView").then((m) => m.EsportView),
  { loading: () => <PageLoadShell label="Cargando estadísticas…" /> },
);

export function LazyEsportView() {
  return <EsportView />;
}
