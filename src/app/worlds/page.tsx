import type { Metadata } from "next";
import { WorldsHubView } from "@/components/worlds/WorldsHubView";

export const metadata: Metadata = {
  title: "Worlds 2026 · BrawlForge",
  description: "Hub especial World Finals 2026: camino al título, predicciones y trivia BSC.",
};

export default function WorldsPage() {
  return <WorldsHubView />;
}
