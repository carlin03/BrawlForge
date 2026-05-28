import type { Metadata } from "next";
import { RankingsView } from "@/components/platform/RankingsView";
import { teams } from "@/lib/data";

export const metadata: Metadata = {
  title: "Rankings — BrawlForge",
  description: "Tabla global de clubes BSC Tier B+ por posición.",
};

export default function RankingsPage() {
  return <RankingsView teams={teams} />;
}
