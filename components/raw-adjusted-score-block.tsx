import { HelpTooltip } from "@/components/help-tooltip";
import { StarRating } from "@/components/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_EXPLANATION } from "@/lib/constants";
import type { StoreScoreCache } from "@/lib/types";

type RawAdjustedScoreBlockProps = {
  score: StoreScoreCache | null;
  compact?: boolean;
};

function formatScore(value: number | null | undefined) {
  return typeof value === "number" && !Number.isNaN(value) ? value.toFixed(2) : "없음";
}

function ScoreContent({ score, compact = false }: RawAdjustedScoreBlockProps) {
  const adjustedScore = score?.adjusted_score ?? 0;
  const reviewCount = score?.review_count ?? 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <span>보정 점수</span>
        <HelpTooltip label="보정 점수">{SCORE_EXPLANATION}</HelpTooltip>
      </div>
      <StarRating
        value={adjustedScore}
        size={compact ? "md" : "lg"}
        label="보정 점수"
        className={compact ? "text-base" : "text-lg"}
      />
      <p className="text-xs font-medium text-zinc-500">
        원점수 {formatScore(score?.raw_score)} · 리뷰 {reviewCount}개
      </p>
    </div>
  );
}

export function RawAdjustedScoreBlock({ score, compact = false }: RawAdjustedScoreBlockProps) {
  if (compact) {
    return <ScoreContent score={score} compact />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>점수 모델</CardTitle>
      </CardHeader>
      <CardContent>
        <ScoreContent score={score} />
      </CardContent>
    </Card>
  );
}
