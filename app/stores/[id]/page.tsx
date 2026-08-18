import Link from "next/link";
import { notFound } from "next/navigation";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { ReviewCard } from "@/components/review-card";
import { RevisitRateDetail } from "@/components/revisit-rate";
import { RisingStoreBadge } from "@/components/rising-store-badge";
import { ScoreBadge } from "@/components/score-badge";
import { StoreMap } from "@/components/store-map";
import { StoreMenuList } from "@/components/store-menu-list";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import { getReviewsForStore, getStore, getStoreMenus } from "@/lib/queries";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { ReviewWithProfile, StoreMenu, StoreWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

type StoreDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  let store: StoreWithScore | null = null;
  let reviews: ReviewWithProfile[] = [];
  let menus: StoreMenu[] = [];
  let supabaseIssue: SupabaseIssueKind | null = null;

  try {
    [store, reviews, menus] = await Promise.all([
      getStore(params.id),
      getReviewsForStore(params.id),
      getStoreMenus(params.id)
    ]);
  } catch (error) {
    if (!isSupabaseSetupOrConnectionError(error)) {
      throw error;
    }

    supabaseIssue = getSupabaseIssueKind(error);
  }

  if (supabaseIssue) {
    return (
      <div className="tt-container tt-page">
        <DatabaseSetupNotice kind={supabaseIssue} />
      </div>
    );
  }

  if (!store) {
    notFound();
  }

  const ratingTextMismatchCount = reviews.filter((review) => review.rating_text_mismatch).length;
  const sectionMismatchCount = reviews.filter((review) => review.section_sentiment_mismatch).length;
  const ratingTextMismatchRate = reviews.length ? (ratingTextMismatchCount / reviews.length) * 100 : 0;
  const sectionMismatchRate = reviews.length ? (sectionMismatchCount / reviews.length) * 100 : 0;

  return (
    <div className="tt-container tt-page">
      <header className="tt-page-hero">
        <div className="tt-detail-header">
        <div className="tt-detail-heading">
          <div>
            <p className="tt-kicker">Store Profile</p>
            <h1 className="tt-detail-title">
              {store.name}
            </h1>
            {store.rising?.isRising ? (
              <div style={{ marginTop: 10 }}>
                <RisingStoreBadge rising={store.rising} />
              </div>
            ) : null}
            <p className="tt-store-meta">
              {formatRegionLabel(store.region)} · {formatCategoryLabel(store.category)}
              {store.address ? ` · ${store.address}` : ""}
            </p>
          </div>
          <div className="tt-chip-row">
            <VerificationBadge status={store.verification_status} />
            <TrustBadge level={store.score?.trust_level} />
          </div>
        </div>
        <Link href={`/stores/${store.id}/review`} className={buttonVariants()}>
          리뷰 작성
        </Link>
      </div>
      </header>

      <div className="tt-detail-layout">
        <RawAdjustedScoreBlock score={store.score} />
        <Card>
          <CardHeader>
            <CardTitle>점수 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tt-score-detail-grid">
              <ScoreBadge label="맛" value={store.score?.taste_score} />
              <ScoreBadge label="서비스" value={store.score?.service_score} />
              <ScoreBadge label="분위기" value={store.score?.environment_score} />
            </div>
            <div className="tt-inline-stat-grid" style={{ marginTop: 18 }}>
              <div>
                <div className="tt-inline-stat__label">리뷰 수</div>
                <div className="tt-inline-stat__value">{store.score?.review_count ?? 0}</div>
              </div>
              <div>
                <div className="tt-inline-stat__label">재방문 리뷰어</div>
                <RevisitRateDetail score={store.score} />
              </div>
              <div>
                <div className="tt-inline-stat__label">시장 평균 RAW</div>
                <div className="tt-inline-stat__value">
                  {store.score?.peer_average_raw_score.toFixed(2) ?? "없음"}
                </div>
              </div>
              <div>
                <div className="tt-inline-stat__label">TT Index</div>
                <div className="tt-inline-stat__value">{store.score?.ranking_score.toFixed(2) ?? "없음"}</div>
              </div>
            </div>
            <div className="tt-review-signal" style={{ marginTop: 18 }}>
              <div className="tt-review-signal__title">리뷰 신호</div>
              <div className="tt-review-signal__list">
                <div>
                  입력 항목 검토 필요 리뷰 {sectionMismatchCount}개
                  <span> · 전체 리뷰 대비 {sectionMismatchRate.toFixed(1)}%</span>
                </div>
                <div>
                  점수-내용 불일치 리뷰 {ratingTextMismatchCount}개
                  <span> · 전체 리뷰 대비 {ratingTextMismatchRate.toFixed(1)}%</span>
                </div>
              </div>
              <p className="tt-review-signal__note">
                이 신호는 매장 평가를 직접 확정하지 않고, 리뷰 내용을 더 살펴볼 수 있게 돕는 참고 지표입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="tt-detail-map-layout" style={{ marginTop: 20 }}>
        <StoreMap store={store} />
        <StoreMenuList menus={menus} />
      </div>

      <section>
        <div className="tt-section-header">
          <h2 className="tt-section-title">리뷰</h2>
          <span className="tt-section-count">표시 중 {reviews.length}개</span>
        </div>
        {reviews.length ? (
          <div className="tt-review-list">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="tt-empty-state">
            아직 표시할 리뷰가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
