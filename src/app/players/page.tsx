import type { Metadata } from "next";
import { PlayersView } from "@/components/platform/PlayersView";
import { players } from "@/lib/data";

export const metadata: Metadata = {
  title: "Jugadores — BrawlForge",
  description: `Catálogo de ${players.length} pros BSC con equipos, fantasy y filtros.`,
};

export default function PlayersPage() {
  return <PlayersView />;
}
