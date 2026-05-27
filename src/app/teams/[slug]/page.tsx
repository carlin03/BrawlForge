import { notFound } from "next/navigation";
import { TeamDetailView } from "@/components/platform/TeamDetailView";
import { getTeam, teams } from "@/lib/data";

export function generateStaticParams() {
  return teams.map((t) => ({ slug: t.slug }));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getTeam(slug)) notFound();
  return <TeamDetailView slug={slug} />;
}
