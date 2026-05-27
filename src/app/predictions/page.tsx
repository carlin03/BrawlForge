import { PredictionsView } from "@/components/platform/PredictionsView";
import { closedPredictions, openPredictions } from "@/lib/data";

export default function PredictionsPage() {
  return <PredictionsView open={openPredictions} closed={closedPredictions} />;
}
