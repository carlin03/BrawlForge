import type { Metadata } from "next";
import { ArenaPlayers } from "@/components/arena/ArenaPlayers";
import { getActivePlayers, players } from "@/lib/data";

export const metadata: Metadata = {
  title: "Jugadores — BrawlForge",
  description: `Catálogo de ${players.length} pros BSC.`,
};

export default function PlayersPage() {
  return <ArenaPlayers />;
}
