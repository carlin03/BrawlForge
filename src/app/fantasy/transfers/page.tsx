import { redirect } from "next/navigation";

export default function FantasyTransfersPage() {
  redirect("/fantasy?tab=market&tournament=bsc-2026-brawl-cup");
}
