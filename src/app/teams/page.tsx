import { TeamsView } from "@/components/platform/TeamsView";
import { teams } from "@/lib/data";

export default function TeamsPage() {
  return <TeamsView teams={teams} />;
}
