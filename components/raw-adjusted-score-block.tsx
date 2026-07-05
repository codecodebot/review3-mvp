import { ScoreBadge } from "@/components/score-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_EXPLANATION } from "@/lib/constants";
import type { StoreScoreCache } from "@/lib/types";

type RawAdjustedScoreBlockProps = {
  score: StoreScoreCache | null;
  compact?: boolean;
};

function ScoreContent({ score }: Pick<RawAdjustedScoreBlockProps, "score">) {
  return (
    <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ScoreBadge label="RAW score" value={score?.raw_score} tone="raw" />
          <ScoreBadge label="Adjusted score" value={score?.adjusted_score ?? 3} tone="adjusted" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{SCORE_EXPLANATION}</p>
    </div>
  );
}

export function RawAdjustedScoreBlock({ score, compact = false }: RawAdjustedScoreBlockProps) {
  if (compact) {
    return <ScoreContent score={score} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Model</CardTitle>
      </CardHeader>
      <CardContent>
        <ScoreContent score={score} />
      </CardContent>
    </Card>
  );
}
