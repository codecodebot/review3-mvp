import Link from "next/link";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { StoreWithScore } from "@/lib/types";
import { cn } from "@/lib/utils";

type StoreCardProps = {
  store: StoreWithScore;
};

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "0%";
  }

  return `${Math.round(value * 100)}%`;
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="leading-6">{store.name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {store.region} · {store.category}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <VerificationBadge status={store.verification_status} />
          <TrustBadge level={store.score?.trust_level} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RawAdjustedScoreBlock score={store.score} compact />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Reviews</div>
            <div className="font-medium">{store.score?.review_count ?? 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Revisit intent</div>
            <div className="font-medium">{formatPercent(store.score?.revisit_intent_rate)}</div>
          </div>
        </div>
        <Link
          href={`/stores/${store.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          View details
        </Link>
      </CardContent>
    </Card>
  );
}
