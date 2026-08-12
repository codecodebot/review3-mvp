import Link from "next/link";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { RevisitRateDetail } from "@/components/revisit-rate";
import { RisingStoreBadge } from "@/components/rising-store-badge";
import { ScoreDelta } from "@/components/score-delta";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import type { StoreWithScore } from "@/lib/types";
import { cn } from "@/lib/utils";

type StoreCardProps = {
  store: StoreWithScore;
};

export function StoreCard({ store }: StoreCardProps) {
  const rawScore = store.score?.raw_score ?? 0;
  const adjustedScore = store.score?.adjusted_score ?? 0;
  const hasCoordinates = typeof store.lat === "number" && typeof store.lng === "number";

  return (
    <Card
      id={`store-${store.id}`}
      className="group scroll-mt-24 overflow-hidden transition target:border-zinc-950 target:ring-2 target:ring-zinc-950/10 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_18px_48px_rgba(15,23,42,0.075)]"
    >
      <CardHeader className="space-y-4 pb-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-500">
              매장 프로필
            </span>
            {hasCoordinates ? (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                지도 표시
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="line-clamp-2 text-lg leading-6">{store.name}</CardTitle>
            <RisingStoreBadge rising={store.rising} compact />
          </div>
          {store.rising?.isRising ? (
            <p className="mt-2 text-xs font-medium leading-5 text-indigo-700">
              최근 유효 리뷰가 과거 평균보다 높습니다.
            </p>
          ) : null}
          <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
            {formatRegionLabel(store.region)} · {formatCategoryLabel(store.category)}
          </p>
          {store.address ? (
            <p className="mt-2 line-clamp-2 text-xs leading-6 text-zinc-500">{store.address}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <VerificationBadge status={store.verification_status} />
          <TrustBadge level={store.score?.trust_level} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_100%)] p-4">
          <RawAdjustedScoreBlock score={store.score} compact />
          <div className="mt-3">
            <ScoreDelta adjustedScore={adjustedScore} rawScore={rawScore} />
          </div>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">리뷰 수</div>
            <div className="mt-1 font-semibold tabular-nums text-zinc-950">
              {store.score?.review_count ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
              재방문
            </div>
            <RevisitRateDetail score={store.score} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={`/stores/${store.id}`}
            className={cn(buttonVariants({ size: "sm" }), "w-full")}
          >
            상세 보기
          </Link>
          <Link
            href={`/stores/${store.id}#location-map`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
          >
            지도 보기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
