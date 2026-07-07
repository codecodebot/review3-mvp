import { ScoreBadge } from "@/components/score-badge";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ReviewCard({ review }: ReviewCardProps) {
  const isDemoReview = review.is_synthetic || review.profile?.is_synthetic;
  const purchaseVerified = review.purchase_verified ?? true;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">
                {review.profile?.nickname ?? "익명 리뷰어"}
              </CardTitle>
              {isDemoReview ? <Badge variant="muted">데모</Badge> : null}
              <Badge
                variant="outline"
                className={
                  purchaseVerified
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600"
                }
              >
                {purchaseVerified ? "구매 인증" : "구매 미인증"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
          </div>
          <TrustBadge trustScore={review.profile?.trust_score} />
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge label="리뷰 점수" value={review.review_score} tone="raw" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <ScoreBadge label="맛" value={review.taste_score} />
          <ScoreBadge label="서비스" value={review.service_score} />
          <ScoreBadge label="공간" value={review.environment_score} />
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">
          {review.review_text || "작성된 리뷰가 없습니다."}
        </p>
        {!purchaseVerified ? (
          <p className="text-xs font-medium text-zinc-500">
            구매 미인증 리뷰는 점수 계산에서 낮은 가중치로 반영됩니다.
          </p>
        ) : null}
        {review.high_score_reason ? (
          <div className="rounded-md border bg-muted p-3 text-sm">
            <span className="font-medium">고득점 이유: </span>
            {review.high_score_reason}
          </div>
        ) : null}
        {review.photo_url ? (
          <a
            href={review.photo_url}
            target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
            사진 보기
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
