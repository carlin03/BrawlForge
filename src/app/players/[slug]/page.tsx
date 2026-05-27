import { notFound } from "next/navigation";
import { PlayerDetailView } from "@/components/platform/PlayerDetailView";
import { players } from "@/lib/data";

export function generateStaticParams() {
  return players.map((p) => ({ slug: p.slug }));
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exists = players.some((p) => p.slug === slug);
  if (!exists) notFound();

  return <PlayerDetailView slug={slug} />;
}
