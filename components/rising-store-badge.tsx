import { Badge } from "@/components/ui/badge";
import type { StoreRisingSignal } from "@/lib/types";
import { cn } from "@/lib/utils";

type RisingStoreBadgeProps = {
  rising?: StoreRisingSignal | null;
  compact?: boolean;
  className?: string;
};

export function RisingStoreBadge({ rising, compact = false, className }: RisingStoreBadgeProps) {
  if (!rising?.isRising) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-200 bg-amber-50/80 font-semibold text-amber-800",
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
      title={`최근 평점 +${rising.risingDelta.toFixed(2)} · 최근 리뷰 ${rising.recentReviewCount}개`}
    >
      떠오르는 매장
      {!compact ? (
        <span className="ml-1 font-bold tabular-nums">+{rising.risingDelta.toFixed(2)}</span>
      ) : null}
    </Badge>
  );
}
