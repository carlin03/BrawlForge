import { PlayerDetailView } from "@/components/platform/PlayerDetailView";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PlayerDetailView slug={slug} />;
}
