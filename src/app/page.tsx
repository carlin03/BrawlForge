import { StaticHomeFallback } from "@/components/platform/StaticHomeFallback";
import { HomePageRouter } from "@/components/platform/HomePageRouter";

export default function Page() {
  return (
    <>
      <StaticHomeFallback />
      <HomePageRouter />
    </>
  );
}
