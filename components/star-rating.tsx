import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  label?: string;
  className?: string;
};

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6"
} satisfies Record<NonNullable<StarRatingProps["size"]>, string>;

const gapClass = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1"
} satisfies Record<NonNullable<StarRatingProps["size"]>, string>;

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2.75l2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.95 6.44 19.87l1.06-6.2L3 9.28l6.22-.9L12 2.75z" />
    </svg>
  );
}

export function StarRating({
  value,
  max = 5,
  size = "md",
  showValue = true,
  label = "TT 점수",
  className
}: StarRatingProps) {
  const safeMax = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 5;
  const safeInput = Number.isFinite(value) ? value : 0;
  const safeValue = Math.max(0, Math.min(safeInput, safeMax));

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      role="img"
      aria-label={`${label} ${safeValue.toFixed(2)}점`}
    >
      <div className={cn("flex items-center", gapClass[size])}>
        {Array.from({ length: safeMax }, (_, index) => {
          let fillPercent = 0;

          if (safeValue >= index + 1) {
            fillPercent = 100;
          } else if (safeValue > index) {
            fillPercent = (safeValue - index) * 100;
          }

          return (
            <span key={index} className={cn("relative inline-block shrink-0", sizeClass[size])}>
              <StarIcon className="absolute inset-0 h-full w-full text-zinc-200" />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
                aria-hidden="true"
              >
                <StarIcon className={cn(sizeClass[size], "text-amber-400")} />
              </span>
            </span>
          );
        })}
      </div>
      {showValue ? (
        <span className="font-semibold tabular-nums leading-none text-zinc-950">
          {safeValue.toFixed(2)}
        </span>
      ) : null}
    </div>
  );
}
