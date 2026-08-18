import { HelpTooltip } from "@/components/help-tooltip";
import { StarRating } from "@/components/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_EXPLANATION } from "@/lib/constants";
import type { StoreScoreCache } from "@/lib/types";

type RawAdjustedScoreBlockProps = {
  score: StoreScoreCache | null;
  compact?: boolean;
};

const RAW_STAR_COLOR = "#F4C430";
const TT_STAR_COLOR = "#1F6F68";

function formatScore(value: number | null | undefined) {
  return typeof value === "number" && !Number.isNaN(value) ? value.toFixed(2) : "없음";
}

function ScoreContent({ score, compact = false }: RawAdjustedScoreBlockProps) {
  const ttIndex = score?.adjusted_score ?? 0;
  const rawScore = score?.raw_score ?? 0;
  const reviewCount = score?.review_count ?? 0;
  const scoreWidth = Math.max(0, Math.min(100, ((ttIndex - 1) / 4) * 100));
  const marketPosition =
    ttIndex >= 3.6
      ? "강한 평균 이상"
      : ttIndex >= 3.3
        ? "평균 이상"
        : ttIndex >= 2.95
          ? "시장 평균"
          : "추가 검토 필요";

  return (
    <div className="tt-score-block">
      <div className="tt-score-block__heading">
        <span>TT Index</span>
        <HelpTooltip label="TT Index">{SCORE_EXPLANATION}</HelpTooltip>
      </div>
      <div className="tt-score-pair">
        <div className="tt-score-tile">
          <div className="tt-score-label">
            RAW Score
          </div>
          <div
            className={compact ? "tt-score-value tt-score-value--compact" : "tt-score-value"}
          >
            {formatScore(rawScore)}
          </div>
          <StarRating
            value={rawScore}
            size={compact ? "sm" : "md"}
            label="RAW Score"
            color={RAW_STAR_COLOR}
          />
        </div>
        <div className="tt-score-tile tt-score-tile--tt">
          <div className="tt-score-label">
            TT Index
          </div>
          <div
            className={compact ? "tt-score-value tt-score-value--compact" : "tt-score-value"}
          >
            {formatScore(ttIndex)}
          </div>
          <StarRating
            value={ttIndex}
            size={compact ? "sm" : "md"}
            label="TT Index"
            color={TT_STAR_COLOR}
          />
        </div>
      </div>
      <div className="tt-score-footer">
        <span>{marketPosition}</span>
        <span>리뷰 {reviewCount}개</span>
      </div>
      <div className="tt-progress">
        <div className="tt-progress__fill" style={{ width: `${scoreWidth}%` }} />
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
      <CardHeader>
        <CardTitle>TT Index 모델</CardTitle>
      </CardHeader>
      <CardContent>
        <ScoreContent score={score} />
      </CardContent>
    </Card>
  );
}
