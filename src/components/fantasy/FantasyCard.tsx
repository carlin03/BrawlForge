import { ProRow } from "@/components/esports/ProRow";
import { getPlayerPrice } from "@/lib/data/fantasy";
import { getPickRate } from "@/lib/data/fantasy-meta";
import type { MarketPlayer } from "@/lib/data/fantasy";

export interface FantasyCardProps {
  playerSlug: string;
  isCaptain?: boolean;
  eventPoints?: number;
  gameweekPoints?: number;
  href?: string;
  variant?: "squad" | "market" | "vault";
  price?: number;
  priceChange?: number;
  trending?: MarketPlayer["trending"];
  form?: readonly ("W" | "L")[];
  size?: "md" | "lg";
  interactive?: boolean;
  onPick?: () => void;
}

/** @deprecated Usa ProRow directamente. Wrapper legacy para compatibilidad. */
export function FantasyCard({
  playerSlug,
  isCaptain,
  eventPoints,
  href,
  variant = "vault",
  price,
  form,
  interactive = true,
  onPick,
}: FantasyCardProps) {
  const displayPrice = price ?? getPlayerPrice(playerSlug);

  const row = (
    <ProRow
      playerSlug={playerSlug}
      href={interactive ? href : undefined}
      isCaptain={isCaptain}
      eventPoints={eventPoints}
      price={displayPrice}
      pickRate={getPickRate(playerSlug)}
      form={form}
      showForm
      showRating
      showFantasy={variant === "vault"}
      showPrice
      showPick={variant === "market"}
      showEvent={variant === "squad"}
      onPick={onPick}
      inSquad={false}
    />
  );

  if (!interactive) {
    return (
      <table className="es-table">
        <tbody>{row}</tbody>
      </table>
    );
  }

  return row;
}
