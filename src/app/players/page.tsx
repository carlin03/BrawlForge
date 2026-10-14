import type { Metadata } from "next";
import { WorldsPlayersView } from "@/components/worlds/WorldsPlayersView";
import { getWorlds2026Players } from "@/lib/data/worlds-2026-field";

export const metadata: Metadata = {
  title: "Jugadores · World Finals 2026",
  description: `Plantillas del Mundial: ${getWorlds2026Players().length} jugadores en Tokio.`,
};

export default function PlayersPage() {
  return <WorldsPlayersView />;
}
