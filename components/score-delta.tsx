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
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : delta < -0.05
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
        tone,
        className
      )}
    >
      {label} {formatDelta(delta)}
    </span>
  );
}
