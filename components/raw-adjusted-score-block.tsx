import { HelpTooltip } from "@/components/help-tooltip";
import { ScoreDelta } from "@/components/score-delta";
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
  const ttIndex = score?.adjusted_score ?? 0;
  const rawScore = score?.raw_score ?? 0;
  const reviewCount = score?.review_count ?? 0;
  const hasEvidence = reviewCount > 0;
  const scoreWidth = hasEvidence ? Math.max(0, Math.min(100, ((ttIndex - 1) / 4) * 100)) : 0;
  const marketPosition =
    reviewCount < 5
      ? "근거 부족"
      : ttIndex >= 3.6
      ? "강한 평균 이상"
      : ttIndex >= 3.3
        ? "평균 이상"
        : ttIndex >= 2.95
          ? "시장 평균"
          : "추가 검토 필요";
  const updatedAt = score?.updated_at
    ? new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(score.updated_at))
    : "미확인";

  return (
    <div className="tt-score-block">
      <div className="tt-score-block__heading">
        <span>Score report</span>
        <HelpTooltip label="TT Index">{SCORE_EXPLANATION}</HelpTooltip>
      </div>
      <div className="tt-score-pair">
        <div className="tt-score-tile tt-score-tile--tt">
          <div className="tt-score-label">TT Index</div>
          <div
            className={compact ? "tt-score-value tt-score-value--compact" : "tt-score-value tt-score-value--primary"}
          >
            {formatScore(hasEvidence ? ttIndex : null)}
          </div>
          <span className="tt-score-interpretation">{marketPosition}</span>
        </div>
        <div className="tt-score-tile">
          <div className="tt-score-label">RAW Score</div>
          <div
            className={compact ? "tt-score-value tt-score-value--compact" : "tt-score-value"}
          >
            {formatScore(hasEvidence ? rawScore : null)}
          </div>
          <span className="tt-score-caption">원래 리뷰 점수</span>
        </div>
      </div>
      <div className="tt-score-verdict">
        <strong>{marketPosition}</strong>
        <span>시장에서의 상대 위치를 나타내는 참고 지표입니다.</span>
      </div>
      <div className="tt-score-footer">
        <ScoreDelta adjustedScore={ttIndex} rawScore={rawScore} />
        <span>리뷰 {reviewCount}개 · {updatedAt} 분석</span>
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
