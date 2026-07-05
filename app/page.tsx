import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_EXPLANATION } from "@/lib/constants";
import { cn } from "@/lib/utils";

type HomePageProps = {
  searchParams?: {
    auth?: string;
  };
};

export default function HomePage({ searchParams }: HomePageProps) {
  const authRequired = searchParams?.auth === "required";

  return (
    <div className="container py-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          {authRequired ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You need to be signed in with Supabase Auth before creating a review.
            </div>
          ) : null}
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Trust-weighted restaurant and cafe reviews
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
              Show the rating people gave, then show how much the rating can be trusted.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              This MVP separates taste, service, and environment, then displays both RAW
              and adjusted scores so inflated or distorted review patterns are easier to spot.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/stores" className={cn(buttonVariants(), "gap-2")}>
              Browse stores <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/ranking" className={buttonVariants({ variant: "outline" })}>
              View ranking
            </Link>
          </div>
        </div>
        <RawAdjustedScoreBlock
          score={{
            store_id: "demo",
            raw_score: 4.42,
            bayesian_raw_score: 3.91,
            adjusted_score: 3.34,
            ranking_score: 3.48,
            taste_score: 4.7,
            service_score: 4.1,
            environment_score: 4.2,
            review_count: 12,
            revisit_intent_rate: 0.74,
            trust_level: "medium",
            peer_average_raw_score: 3.48,
            updated_at: new Date().toISOString()
          }}
        />
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Three dimensions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Reviews score taste, service, and environment separately. The individual review
            score is taste 50%, service 25%, and environment 25%.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rule-based weights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Review quality and user trust weights are transparent MVP rules, including text
            length, photos, revisit intent, review count, reports, and hidden review history.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Always show RAW</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {SCORE_EXPLANATION}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
