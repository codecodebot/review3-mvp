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
    return "N/A";
  }

  return value.toFixed(2);
}

export function ScoreBadge({ label, value, tone = "subtle", className }: ScoreBadgeProps) {
  const toneClass =
    tone === "adjusted"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "raw"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-border bg-muted text-foreground";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Badge variant="outline" className={cn("text-sm", toneClass)}>
        {formatScore(value)}
      </Badge>
    </div>
  );
}
