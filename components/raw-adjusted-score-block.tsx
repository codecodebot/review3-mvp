import { HelpTooltip } from "@/components/help-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_EXPLANATION } from "@/lib/constants";
import type { StoreScoreCache } from "@/lib/types";
import { cn } from "@/lib/utils";

type RawAdjustedScoreBlockProps = {
  score: StoreScoreCache | null;
  compact?: boolean;
};

function formatScore(value: number | null | undefined) {
  return typeof value === "number" && !Number.isNaN(value) ? value.toFixed(2) : "없음";
}

function ScoreContent({ score, compact = false }: RawAdjustedScoreBlockProps) {
  const adjustedScore = score?.adjusted_score ?? 0;
  const rawScore = score?.raw_score ?? 0;
  const reviewCount = score?.review_count ?? 0;
  const scoreWidth = Math.max(0, Math.min(100, ((adjustedScore - 1) / 4) * 100));

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        <span>Adjusted Score</span>
        <HelpTooltip label="보정 점수">{SCORE_EXPLANATION}</HelpTooltip>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className={cn("font-semibold tabular-nums tracking-tight text-zinc-950", compact ? "text-3xl" : "text-5xl")}>
          {formatScore(adjustedScore)}
        </div>
        <div className="text-right text-xs font-medium leading-5 text-zinc-500">
          <div>원점수 {formatScore(rawScore)}</div>
          <div>리뷰 {reviewCount}개</div>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-zinc-950"
          style={{ width: `${scoreWidth}%` }}
        />
      </div>
    </div>
  );
}

export function RawAdjustedScoreBlock({ score, compact = false }: RawAdjustedScoreBlockProps) {
  if (compact) {
    return <ScoreContent score={score} compact />;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>점수 모델</CardTitle>
      </CardHeader>
      <CardContent>
        <ScoreContent score={score} />
      </CardContent>
    </Card>
  );
}
