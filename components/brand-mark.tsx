import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <span className={cn("tt-wordmark", className)} aria-label="TrustTable">
      <span className="tt-wordmark__symbol" aria-hidden="true">
        <svg viewBox="0 0 32 32" focusable="false">
          <path d="M3 6.5h11v3.5H3zM18 6.5h11v3.5H18z" />
          <path d="M9.5 11.5H14v14H9.5zM18 11.5h4.5v14H18z" />
          <path className="tt-wordmark__signal" d="m16 13 2.25 3.25L16 19.5l-2.25-3.25z" />
        </svg>
      </span>
      {compact ? null : <span className="tt-wordmark__text">TrustTable</span>}
    </span>
  );
}
