import { notFound } from "next/navigation";
import { MatchDetailView } from "@/components/platform/MatchDetailView";
import { resolveMatchById } from "@/lib/data/resolve-match";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await resolveMatchById(id);
  if (!match) notFound();
  return <MatchDetailView match={match} />;
}
