import { notFound } from "next/navigation";
import { MatchDetailView } from "@/components/platform/MatchDetailView";
import { getMatch } from "@/lib/data";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getMatch(id)) notFound();
  return <MatchDetailView id={id} />;
}
