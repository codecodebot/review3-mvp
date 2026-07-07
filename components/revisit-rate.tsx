import { HelpTooltip } from "@/components/help-tooltip";
import { REVISIT_RATE_EXPLANATION } from "@/lib/constants";
import type { StoreScoreCache } from "@/lib/types";

type RevisitRateValueProps = {
  score:
    | Pick<
        StoreScoreCache,
        "revisit_rate" | "unique_reviewer_count" | "returning_reviewer_count"
      >
    | null
    | undefined;
};

export function formatRevisitRate(
  score: RevisitRateValueProps["score"]
) {
  if (!score || typeof score.revisit_rate !== "number") {
    return "데이터 부족";
  }

  return `${Math.round(score.revisit_rate * 100)}%`;
}

export function RevisitRateValue({ score }: RevisitRateValueProps) {
  return <>{formatRevisitRate(score)}</>;
}

export function RevisitRateDetail({ score }: RevisitRateValueProps) {
  const reviewerCounts =
    score && score.unique_reviewer_count > 0
      ? `${score.returning_reviewer_count}/${score.unique_reviewer_count}명`
      : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 font-medium">
        <RevisitRateValue score={score} />
        <HelpTooltip label="재방문 리뷰어">{REVISIT_RATE_EXPLANATION}</HelpTooltip>
      </div>
      {reviewerCounts ? <div className="text-xs text-muted-foreground">{reviewerCounts}</div> : null}
    </div>
  );
}
