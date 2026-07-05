import { ScoreBadge } from "@/components/score-badge";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewWithProfile } from "@/lib/types";

type ReviewCardProps = {
  review: ReviewWithProfile;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {review.profile?.nickname ?? "Anonymous reviewer"}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
          </div>
          <TrustBadge trustScore={review.profile?.trust_score} />
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge label="Review" value={review.review_score} tone="raw" />
          <Badge variant="secondary">{`Revisit: ${review.revisit_intent ?? "unsure"}`}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <ScoreBadge label="Taste" value={review.taste_score} />
          <ScoreBadge label="Service" value={review.service_score} />
          <ScoreBadge label="Environment" value={review.environment_score} />
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">
          {review.review_text || "No written review."}
        </p>
        {review.high_score_reason ? (
          <div className="rounded-md border bg-muted p-3 text-sm">
            <span className="font-medium">High-score reason: </span>
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
            Photo reference
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
