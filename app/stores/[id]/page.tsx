import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/review-card";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { ScoreBadge } from "@/components/score-badge";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviewsForStore, getStore } from "@/lib/queries";

export const dynamic = "force-dynamic";

type StoreDetailPageProps = {
  params: {
    id: string;
  };
};

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "0%";
  }

  return `${Math.round(value * 100)}%`;
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const [store, reviews] = await Promise.all([getStore(params.id), getReviewsForStore(params.id)]);

  if (!store) {
    notFound();
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">{store.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {store.region} · {store.category}
              {store.address ? ` · ${store.address}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <VerificationBadge status={store.verification_status} />
            <TrustBadge level={store.score?.trust_level} />
          </div>
        </div>
        <Link href={`/stores/${store.id}/review`} className={buttonVariants()}>
          Write review
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <RawAdjustedScoreBlock score={store.score} />
        <Card>
          <CardHeader>
            <CardTitle>Score Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <ScoreBadge label="Taste" value={store.score?.taste_score} />
              <ScoreBadge label="Service" value={store.score?.service_score} />
              <ScoreBadge label="Environment" value={store.score?.environment_score} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Reviews</div>
                <div className="font-medium">{store.score?.review_count ?? 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Revisit intent</div>
                <div className="font-medium">{formatPercent(store.score?.revisit_intent_rate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Peer average</div>
                <div className="font-medium">
                  {store.score?.peer_average_raw_score.toFixed(2) ?? "N/A"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Ranking score</div>
                <div className="font-medium">{store.score?.ranking_score.toFixed(2) ?? "N/A"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-normal">Reviews</h2>
          <span className="text-sm text-muted-foreground">{reviews.length} visible</span>
        </div>
        {reviews.length ? (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
            No visible reviews yet.
          </div>
        )}
      </section>
    </div>
  );
}
