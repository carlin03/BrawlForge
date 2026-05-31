import { TeamDetailView } from "@/components/platform/TeamDetailView";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeamDetailView slug={slug} />;
}
