import { notFound } from "next/navigation";
import { TournamentDetailView } from "@/components/platform/TournamentDetailView";
import { getTournament } from "@/lib/data";

export default async function TournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getTournament(slug)) notFound();
  return <TournamentDetailView slug={slug} />;
}
