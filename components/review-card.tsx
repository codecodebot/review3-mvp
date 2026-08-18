import { ScoreBadge } from "@/components/score-badge";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import type { ReviewWithProfile } from "@/lib/types";

type ReviewCardProps = {
  review: ReviewWithProfile;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function TooltipBadge({
  label,
  tooltip,
  className
}: {
  label: string;
  tooltip: string;
  className?: string;
}) {
  return (
    <span className="tt-tooltip-badge">
      <Badge variant="warning" className={className} tabIndex={0} aria-label={`${label}: ${tooltip}`}>
        {label}
      </Badge>
      <span className="tt-tooltip-badge__content">
        {tooltip}
      </span>
    </span>
  );
}

function ReviewSection({ title, text }: { title: string; text: string | null }) {
  if (!text?.trim()) {
    return null;
  }

  return (
    <div className="tt-review-section">
      <div className="tt-review-section__title">{title}</div>
      <p>{text}</p>
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const isDemoReview = review.is_synthetic || review.profile?.is_synthetic;
  const purchaseVerified = review.purchase_verified ?? true;
  const hasStructuredText = Boolean(review.positive_text?.trim() || review.negative_text?.trim());

  return (
    <article className="tt-review-card">
      <div className="tt-review-card__header">
          <div className="tt-review-card__identity">
            <div className="tt-review-card__name-row">
              <h3 className="tt-review-card__name">
                {review.profile?.nickname ?? "익명 리뷰어"}
              </h3>
              {isDemoReview ? <Badge variant="muted">데모</Badge> : null}
              <Badge
                variant="outline"
                className={
                  purchaseVerified
                    ? "tt-badge--success"
                    : "tt-badge--muted"
                }
              >
                {purchaseVerified ? "구매 인증" : "구매 미인증"}
              </Badge>
              {review.section_sentiment_mismatch ? (
                <TooltipBadge
                  label="입력 항목 검토 필요"
                  tooltip={review.section_mismatch_reason ?? "작성 항목과 내용의 감정 방향이 다르게 감지되었습니다."}
                  className="tt-badge--compact"
                />
              ) : null}
              {review.rating_text_mismatch ? (
                <TooltipBadge
                  label="불일치"
                  tooltip="높은 점수와 부정적인 리뷰 내용이 함께 감지되었습니다."
                  className="tt-badge--compact"
                />
              ) : null}
            </div>
            <p className="tt-review-card__date">{formatDate(review.created_at)}</p>
          </div>
          <TrustBadge trustScore={review.profile?.trust_score} />
        </div>
        <div className="tt-review-card__scores">
          <ScoreBadge label="리뷰 점수" value={review.review_score} tone="raw" />
        </div>
      <div className="tt-review-card__subscores">
          <ScoreBadge label="맛" value={review.taste_score} />
          <ScoreBadge label="서비스" value={review.service_score} />
          <ScoreBadge label="분위기" value={review.environment_score} />
      </div>

        {hasStructuredText ? (
          <div className="tt-review-section-grid">
            <ReviewSection title="좋았던 점" text={review.positive_text} />
            <ReviewSection title="아쉬웠던 점" text={review.negative_text} />
          </div>
        ) : (
          <p className="tt-review-card__text">
            {review.review_text || "작성된 리뷰 내용이 없습니다."}
          </p>
        )}

        {!purchaseVerified ? (
          <p className="tt-review-note">
            구매 미인증 리뷰는 점수 계산에서 낮은 가중치로 반영됩니다.
          </p>
        ) : null}
        {review.high_score_reason ? (
          <div className="tt-review-reason">
            <span>고득점 이유: </span>
            {review.high_score_reason}
          </div>
        ) : null}
        {review.photo_url ? (
          <a
            href={review.photo_url}
            target="_blank"
            rel="noreferrer"
            className="tt-review-photo-link"
          >
            사진 보기
          </a>
        ) : null}
    </article>
  );
}
