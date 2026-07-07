import Link from "next/link";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { RevisitRateDetail } from "@/components/revisit-rate";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import type { StoreWithScore } from "@/lib/types";
import { cn } from "@/lib/utils";

type StoreCardProps = {
  store: StoreWithScore;
};

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Card className="transition hover:border-zinc-300 hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-3 pb-3">
        <div>
          <CardTitle className="line-clamp-2 text-[17px] leading-6">{store.name}</CardTitle>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            {formatRegionLabel(store.region)} / {formatCategoryLabel(store.category)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <VerificationBadge status={store.verification_status} />
          <TrustBadge level={store.score?.trust_level} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-zinc-50 p-3">
          <RawAdjustedScoreBlock score={store.score} compact />
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
            <div className="text-xs font-medium text-zinc-500">리뷰 수</div>
            <div className="mt-1 font-semibold tabular-nums text-zinc-950">
              {store.score?.review_count ?? 0}
            </div>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
            <div className="text-xs font-medium text-zinc-500">재방문 리뷰어</div>
            <RevisitRateDetail score={store.score} />
          </div>
        </div>
        <Link
          href={`/stores/${store.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          자세히 보기
        </Link>
      </CardContent>
    </Card>
  );
}
