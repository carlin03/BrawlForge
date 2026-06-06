import type { Metadata } from "next";
import { LazyEsportView } from "@/components/platform/LazyEsportView";

export const metadata: Metadata = {
  title: "Esports Stats — BrawlForge",
  description:
    "Estadísticas competitivas BSC 2026: win rate, victorias y partidos reales desde Liquipedia.",
};

export default function EsportPage() {
  return <LazyEsportView />;
}
