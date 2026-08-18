import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  label?: string;
  color?: string;
  className?: string;
};

function StarIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("tt-stars__svg", className)}
      fill="currentColor"
      style={color ? { color } : undefined}
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
  label = "TT Index",
  color = "#f59e0b",
  className
}: StarRatingProps) {
  const safeMax = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 5;
  const safeInput = Number.isFinite(value) ? value : 0;
  const safeValue = Math.max(0, Math.min(safeInput, safeMax));

  return (
    <div
      className={cn("tt-stars", `tt-stars--${size}`, className)}
      role="img"
      aria-label={`${label} ${safeValue.toFixed(2)}점, ${safeMax}점 만점`}
    >
      <div className="tt-stars__row">
        {Array.from({ length: safeMax }, (_, index) => {
          let fillPercent = 0;

          if (safeValue >= index + 1) {
            fillPercent = 100;
          } else if (safeValue > index) {
            fillPercent = (safeValue - index) * 100;
          }

          return (
            <span key={index} className="tt-stars__slot">
              <StarIcon />
              <span
                className="tt-stars__fill"
                style={{ width: `${fillPercent}%` }}
                aria-hidden="true"
              >
                <StarIcon color={color} />
              </span>
            </span>
          );
        })}
      </div>
      {showValue ? (
        <span className="tt-stars__value">
          {safeValue.toFixed(2)}
        </span>
      ) : null}
    </div>
  );
}
