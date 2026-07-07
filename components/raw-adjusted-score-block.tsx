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
  const marketPosition =
    adjustedScore >= 3.6 ? "강한 평균 이상" : adjustedScore >= 3.3 ? "평균 이상" : adjustedScore >= 2.95 ? "시장 평균" : "추가 검토 필요";

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        <span>TT Score</span>
        <HelpTooltip label="TT Score">{SCORE_EXPLANATION}</HelpTooltip>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
            RAW Score
          </div>
          <div className={cn("mt-2 font-semibold tabular-nums tracking-tight text-zinc-950", compact ? "text-2xl" : "text-4xl")}>
            {formatScore(rawScore)}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
            TT Score
          </div>
          <div className={cn("mt-2 font-semibold tabular-nums tracking-tight text-zinc-950", compact ? "text-2xl" : "text-4xl")}>
            {formatScore(adjustedScore)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-500">
        <span>{marketPosition}</span>
        <span>리뷰 {reviewCount}개</span>
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
        <CardTitle>TT Score 모델</CardTitle>
      </CardHeader>
      <CardContent>
        <ScoreContent score={score} />
      </CardContent>
    </Card>
  );
}
