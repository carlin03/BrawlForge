import type { Metadata } from "next";
import { EsportView } from "@/components/platform/EsportView";

export const metadata: Metadata = {
  title: "Esports Stats — BrawlForge",
  description:
    "Estadísticas competitivas BSC 2026: win rate, victorias y partidos reales desde Liquipedia.",
};

export default function EsportPage() {
  return <EsportView />;
}
