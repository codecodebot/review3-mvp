import { cn } from "@/lib/utils";

type ScoreDeltaProps = {
  adjustedScore: number;
  rawScore: number;
  label?: string;
  className?: string;
};

function formatDelta(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const sign = safeValue > 0 ? "+" : "";
  return `${sign}${safeValue.toFixed(2)}`;
}

export function ScoreDelta({
  adjustedScore,
  rawScore,
  label = "TT-RAW",
  className
}: ScoreDeltaProps) {
  const delta = adjustedScore - rawScore;
  const tone =
    delta > 0.05
      ? "tt-score-delta--positive"
      : delta < -0.05
        ? "tt-score-delta--negative"
        : "tt-score-delta--neutral";

  return (
    <span className={cn("tt-score-delta", tone, className)}>
      {label} {formatDelta(delta)}
    </span>
  );
}
