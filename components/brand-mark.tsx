import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <span className={cn("tt-wordmark", className)} aria-label="TrustTable">
      <span className="tt-wordmark__symbol" aria-hidden="true">
        <Image
          src="/brand/trusttable-logo.png"
          alt=""
          width={96}
          height={96}
          priority
          className="tt-wordmark__asset"
        />
      </span>
      {compact ? null : <span className="tt-wordmark__text">TrustTable</span>}
    </span>
  );
}
