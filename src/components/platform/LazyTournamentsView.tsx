"use client";

import dynamic from "next/dynamic";
import { PageLoadShell } from "@/components/platform/PageLoadShell";

const TournamentsView = dynamic(
  () => import("@/components/platform/TournamentsView").then((m) => m.TournamentsView),
  { loading: () => <PageLoadShell label="Cargando torneos…" /> },
);

export function LazyTournamentsView() {
  return <TournamentsView />;
}
