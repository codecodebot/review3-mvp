import Link from "next/link";
import { RisingBadge } from "@/components/rising-store-badge";
import { ScoreDelta } from "@/components/score-delta";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import { calculateReviewScore, type ScoreWeights } from "@/lib/scoring";
import type { StoreWithScoreAndReviews } from "@/lib/types";
import { cn } from "@/lib/utils";

type StoreRankCardData = StoreWithScoreAndReviews & {
  rawScore: number;
  normalizedScore: number;
  rawAverageDelta: number;
};

type StoreRankCardProps = {
  store: StoreRankCardData;
  rank: number;
  weights: ScoreWeights;
};

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatDelta(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const sign = safeValue > 0 ? "+" : "";
  return `${sign}${safeValue.toFixed(2)}`;
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "데이터 부족";
  }

  return `${Math.round(value * 100)}%`;
}

function scoreExplanation(store: StoreRankCardData) {
  const ttDelta = store.normalizedScore - store.rawScore;

  if (store.rising?.isRising) {
    return "최근 유효 리뷰 점수가 과거 평균보다 뚜렷하게 높습니다.";
  }

  if (ttDelta < -0.25) {
    return "RAW 점수가 시장 평균과 인증 가중치 적용 후 더 신중하게 해석됩니다.";
  }

  if (ttDelta > 0.15) {
    return "시장 평균 대비 리뷰 신호가 좋아 TT 점수가 RAW보다 높게 나타납니다.";
  }

  return "RAW Score와 TT Score가 안정적으로 정렬되어 있습니다.";
}

function MiniTrend({ store, weights }: StoreRankCardProps) {
  const reviews = [...store.ranking_reviews]
    .sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime())
    .slice(-8);

  if (!reviews.length) {
    return <div className="h-9 rounded-xl bg-zinc-50" aria-hidden />;
  }

  return (
    <div className="flex h-9 items-end gap-1.5" aria-label="최근 리뷰 점수 추이">
      {reviews.map((review, index) => {
        const score = calculateReviewScore(
          review.taste_score,
          review.service_score,
          review.environment_score,
          weights
        );
        const height = Math.max(18, Math.min(100, (score / 5) * 100));

        return (
          <span
            key={`${review.store_id}-${review.created_at ?? index}-${index}`}
            className={cn(
              "block w-2.5 rounded-full",
              review.purchase_verified === false ? "bg-zinc-300" : "bg-zinc-900"
            )}
            style={{ height: `${height}%` }}
            title={`${score.toFixed(2)}점${review.purchase_verified === false ? " · 구매 미인증" : ""}`}
          />
        );
      })}
    </div>
  );
}

export function StoreRankCard({ store, rank, weights }: StoreRankCardProps) {
  return (
    <article className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition hover:border-zinc-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
      <div className="grid gap-5 lg:grid-cols-[72px_minmax(0,1fr)_260px] lg:items-center">
        <div className="flex items-center gap-3 lg:block">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold tabular-nums text-zinc-950">
            #{rank}
          </div>
          <div className="lg:mt-3">
            <MiniTrend store={store} rank={rank} weights={weights} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/stores/${store.id}`}
              className="truncate text-lg font-semibold tracking-normal text-zinc-950 hover:text-zinc-700"
            >
              {store.name}
            </Link>
            <RisingBadge rising={store.rising} compact />
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            {formatRegionLabel(store.region)} · {formatCategoryLabel(store.category)}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            {scoreExplanation(store)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <VerificationBadge status={store.verification_status} />
            <TrustBadge level={store.score?.trust_level} />
            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold leading-none text-zinc-700">
              리뷰 {store.score?.review_count ?? 0}개
            </span>
            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold leading-none text-zinc-700">
              재방문 {formatPercent(store.score?.revisit_rate)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                RAW Score
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-950">
                {formatScore(store.rawScore)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                TT Score
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-950">
                {formatScore(store.normalizedScore)}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-zinc-500">
            <ScoreDelta adjustedScore={store.normalizedScore} rawScore={store.rawScore} />
            <span>시장 평균 대비 {formatDelta(store.rawAverageDelta)}</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-zinc-200">
            <div
              className="h-1.5 rounded-full bg-zinc-950"
              style={{
                width: `${Math.max(0, Math.min(100, ((store.normalizedScore - 1) / 4) * 100))}%`
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
