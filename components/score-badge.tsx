import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ScoreBadgeProps = {
  label: string;
  value: number | null | undefined;
  tone?: "raw" | "adjusted" | "subtle";
  className?: string;
};

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "없음";
  }

  return value.toFixed(2);
}

export function ScoreBadge({ label, value, tone = "subtle", className }: ScoreBadgeProps) {
  const toneClass = tone === "adjusted" ? "tt-score-badge--adjusted" : tone === "raw" ? "tt-score-badge--raw" : "";

  return (
    <div className={cn("tt-score-badge", toneClass, className)}>
      <span className="tt-score-badge__label">{label}</span>
      <Badge variant="outline" className="tt-score-badge__value">
        {formatScore(value)}
      </Badge>
    </div>
  );
}
