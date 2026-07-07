import Link from "next/link";
import { notFound } from "next/navigation";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { ReviewCard } from "@/components/review-card";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { RevisitRateDetail } from "@/components/revisit-rate";
import { RisingStoreBadge } from "@/components/rising-store-badge";
import { ScoreBadge } from "@/components/score-badge";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import { getReviewsForStore, getStore } from "@/lib/queries";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { ReviewWithProfile, StoreWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

type StoreDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  let store: StoreWithScore | null = null;
  let reviews: ReviewWithProfile[] = [];
  let supabaseIssue: SupabaseIssueKind | null = null;

  try {
    [store, reviews] = await Promise.all([getStore(params.id), getReviewsForStore(params.id)]);
  } catch (error) {
    if (!isSupabaseSetupOrConnectionError(error)) {
      throw error;
    }

    supabaseIssue = getSupabaseIssueKind(error);
  }

  if (supabaseIssue) {
    return (
      <div className="container py-8">
        <DatabaseSetupNotice kind={supabaseIssue} />
      </div>
    );
  }

  if (!store) {
    notFound();
  }

  const mismatchReviewCount = reviews.filter((review) => review.rating_text_mismatch).length;
  const mismatchReviewRate = reviews.length ? (mismatchReviewCount / reviews.length) * 100 : 0;

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">
              {store.name}
            </h1>
            {store.rising?.isRising ? (
              <div className="mt-2">
                <RisingStoreBadge rising={store.rising} />
              </div>
            ) : null}
            <p className="mt-2 text-sm font-medium text-zinc-500">
              {formatRegionLabel(store.region)} · {formatCategoryLabel(store.category)}
              {store.address ? ` · ${store.address}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <VerificationBadge status={store.verification_status} />
            <TrustBadge level={store.score?.trust_level} />
          </div>
        </div>
        <Link href={`/stores/${store.id}/review`} className={buttonVariants()}>
          리뷰 작성
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <RawAdjustedScoreBlock score={store.score} />
        <Card>
          <CardHeader>
            <CardTitle>점수 상세</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <ScoreBadge label="맛" value={store.score?.taste_score} />
              <ScoreBadge label="서비스" value={store.score?.service_score} />
              <ScoreBadge label="공간" value={store.score?.environment_score} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">리뷰 수</div>
                <div className="font-medium">{store.score?.review_count ?? 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground">재방문 리뷰어</div>
                <RevisitRateDetail score={store.score} />
              </div>
              <div>
                <div className="text-muted-foreground">시장 평균 RAW</div>
                <div className="font-medium">
                  {store.score?.peer_average_raw_score.toFixed(2) ?? "없음"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">TT 점수</div>
                <div className="font-medium">{store.score?.ranking_score.toFixed(2) ?? "없음"}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm">
              <div className="font-semibold text-zinc-950">리뷰 신호</div>
              <div className="mt-2 text-zinc-700">
                점수-내용 불일치 리뷰 {mismatchReviewCount}개
                <span className="text-zinc-500"> · 전체 리뷰 대비 {mismatchReviewRate.toFixed(1)}%</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                높은 점수와 부정적인 리뷰 내용이 함께 감지된 보조 신뢰도 지표입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-normal text-zinc-950">리뷰</h2>
          <span className="text-sm font-medium text-zinc-500">표시 중 {reviews.length}개</span>
        </div>
        {reviews.length ? (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            아직 표시할 리뷰가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
