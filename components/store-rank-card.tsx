import Link from "next/link";
import { RisingBadge } from "@/components/rising-store-badge";
import { ScoreDelta } from "@/components/score-delta";
import { StarRating } from "@/components/star-rating";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import { calculateReviewScore, type ScoreWeights } from "@/lib/scoring";
import type { StoreWithScoreAndReviews } from "@/lib/types";

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

const RAW_STAR_COLOR = "#F4C430";
const TT_STAR_COLOR = "#1F6F68";

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
    return "RAW 점수가 시장 평균과 검증 가중치 적용 후 더 신중하게 해석됩니다.";
  }

  if (ttDelta > 0.15) {
    return "시장 평균 대비 리뷰 신호가 좋아 TT Index가 RAW보다 높게 나타납니다.";
  }

  return "RAW Score와 TT Index가 안정적으로 정렬되어 있습니다.";
}

function MiniTrend({ store, weights }: StoreRankCardProps) {
  const reviews = [...store.ranking_reviews]
    .sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime())
    .slice(-8);

  if (!reviews.length) {
    return <div className="tt-mini-trend tt-mini-trend--empty" aria-hidden />;
  }

  return (
    <div className="tt-mini-trend" aria-label="최근 리뷰 점수 추이">
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
            className={review.purchase_verified === false ? "tt-trend-bar tt-trend-bar--muted" : "tt-trend-bar"}
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
    <article className="tt-rank-card">
      <div className="tt-rank-card__grid">
        <div className="tt-rank-card__rank">
          <div className="tt-rank-number">
            #{rank}
          </div>
          <MiniTrend store={store} rank={rank} weights={weights} />
        </div>

        <div className="tt-rank-card__body">
          <div className="tt-rank-title-row">
            <Link
              href={`/stores/${store.id}`}
              className="tt-rank-title"
            >
              {store.name}
            </Link>
            <RisingBadge rising={store.rising} compact />
          </div>
          <p className="tt-store-meta">
            {formatRegionLabel(store.region)} · {formatCategoryLabel(store.category)}
          </p>
          <p className="tt-rank-explanation">
            {scoreExplanation(store)}
          </p>
          <div className="tt-chip-row" style={{ marginTop: 14 }}>
            <VerificationBadge status={store.verification_status} />
            <TrustBadge level={store.score?.trust_level} />
            <span className="tt-badge tt-badge--muted">
              리뷰 {store.score?.review_count ?? 0}개
            </span>
            <span className="tt-badge tt-badge--muted">
              재방문 {formatPercent(store.score?.revisit_rate)}
            </span>
          </div>
        </div>

        <div className="tt-rank-score-panel">
          <div className="tt-rank-score-grid">
            <div>
              <div className="tt-score-label">
                RAW Score
              </div>
              <div className="tt-rank-score-value">
                {formatScore(store.rawScore)}
              </div>
              <StarRating
                value={store.rawScore}
                size="sm"
                label="RAW Score"
                color={RAW_STAR_COLOR}
              />
            </div>
            <div>
              <div className="tt-score-label">
                TT Index
              </div>
              <div className="tt-rank-score-value">
                {formatScore(store.normalizedScore)}
              </div>
              <StarRating
                value={store.normalizedScore}
                size="sm"
                label="TT Index"
                color={TT_STAR_COLOR}
              />
            </div>
          </div>
          <div className="tt-rank-score-footer">
            <ScoreDelta adjustedScore={store.normalizedScore} rawScore={store.rawScore} />
            <span>시장 평균 대비 {formatDelta(store.rawAverageDelta)}</span>
          </div>
          <div className="tt-progress" style={{ marginTop: 12 }}>
            <div
              className="tt-progress__fill"
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
