import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";
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
    <div className="container py-10 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          {authRequired ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              리뷰를 작성하려면 먼저 로그인해야 합니다.
            </div>
          ) : null}
          <div className="space-y-4">
            <Image
              src="/brand/trusttable-logo.png"
              alt="Trusttable"
              width={180}
              height={180}
              priority
              className="h-12 w-auto object-contain"
            />
            <p className="text-sm font-semibold text-blue-600">
              신뢰 가중 식당·카페 리뷰
            </p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
              사람들이 준 점수와, 그 점수가 얼마나 믿을 만한지 함께 봅니다.
            </h1>
            <p className="max-w-2xl text-base font-normal leading-7 text-zinc-600">
              맛, 서비스, 공간을 나눠 평가하고 원점수와 보정 점수를 함께 보여줍니다.
              부풀려진 점수나 왜곡된 리뷰 패턴을 더 쉽게 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/stores" className={cn(buttonVariants(), "gap-2")}>
              매장 보기 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/ranking" className={buttonVariants({ variant: "outline" })}>
              랭킹 보기
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
            revisit_rate: 0.38,
            unique_reviewer_count: 8,
            returning_reviewer_count: 3,
            trust_level: "medium",
            peer_average_raw_score: 3.48,
            updated_at: new Date().toISOString()
          }}
        />
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>세 가지 평가</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            리뷰는 맛, 서비스, 공간을 따로 평가합니다. 개별 리뷰 점수는 맛 50%,
            서비스 25%, 공간 25%로 계산합니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>규칙 기반 가중치</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            리뷰 품질과 사용자 신뢰도는 글 길이, 사진, 리뷰 수, 신고, 숨김 이력,
            실제 재방문 리뷰 패턴 같은 명확한 규칙으로 계산합니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>원점수 공개</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm leading-6 text-muted-foreground">
            <span>원점수와 보정 점수를 함께 표시합니다.</span>
            <HelpTooltip label="원점수와 보정 점수">{SCORE_EXPLANATION}</HelpTooltip>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
