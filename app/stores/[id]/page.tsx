import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BarChart3, CheckCircle2 } from "lucide-react";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { ReviewCard } from "@/components/review-card";
import { RevisitRateDetail } from "@/components/revisit-rate";
import { RisingStoreBadge } from "@/components/rising-store-badge";
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

function ScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? value : 0;

  return (
    <div className="tt-breakdown-row">
      <div className="tt-breakdown-row__label"><span>{label}</span><strong>{safeValue.toFixed(2)}</strong></div>
      <div className="tt-breakdown-row__track" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, (safeValue / 5) * 100))}%` }} />
      </div>
    </div>
  );
}

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
      <header className="tt-page-hero tt-result-header">
        <div className="tt-detail-header">
        <div className="tt-detail-heading">
          <div>
            <p className="tt-kicker">Independent analysis report</p>
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
            <p className="tt-result-header__meta">
              리뷰 {store.score?.review_count ?? 0}개 분석 · 최근 갱신 {store.score?.updated_at ? new Intl.DateTimeFormat("ko-KR").format(new Date(store.score.updated_at)) : "미확인"}
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
        <Card className="tt-evidence-summary-card">
          <CardHeader>
            <p className="tt-kicker">Evidence overview</p>
            <CardTitle>점수 근거</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tt-score-detail-grid tt-score-detail-grid--bars">
              <ScoreBar label="맛" value={store.score?.taste_score} />
              <ScoreBar label="서비스" value={store.score?.service_score} />
              <ScoreBar label="분위기" value={store.score?.environment_score} />
            </div>
            <div className="tt-inline-stat-grid tt-inline-stat-grid--evidence">
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
            <div className="tt-evidence-accordion">
              <details>
                <summary><span><BarChart3 aria-hidden="true" /> 리뷰 신뢰도 신호</span><strong>{ratingTextMismatchCount + sectionMismatchCount}건 확인</strong></summary>
                <div className="tt-evidence-accordion__content">
                  <div><CheckCircle2 aria-hidden="true" /><span>구조화 입력 검토</span><strong>{sectionMismatchCount}개 · {sectionMismatchRate.toFixed(1)}%</strong></div>
                  <div><AlertTriangle aria-hidden="true" /><span>점수-내용 불일치</span><strong>{ratingTextMismatchCount}개 · {ratingTextMismatchRate.toFixed(1)}%</strong></div>
                  <p>이 신호는 매장 평가를 확정하지 않고, 더 살펴볼 리뷰를 알려주는 참고 정보입니다.</p>
                </div>
              </details>
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
