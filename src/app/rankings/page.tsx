import type { Metadata } from "next";
import { TeamsView } from "@/components/platform/TeamsView";
import { teams } from "@/lib/data";

export const metadata: Metadata = {
  title: "Rankings — BrawlForge",
  description: "Ranking global de clubes BSC Tier B+.",
};

export default function RankingsPage() {
  return <TeamsView teams={teams} />;
}
