import { Skeleton } from "@/components/ui/skeleton";

type ReportPageSkeletonProps = {
  variant?: "stores" | "ranking" | "store-detail" | "tt-index" | "review";
  message?: string;
};

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="tt-loading-rows">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="tt-loading-row">
          <Skeleton className="tt-loading-row__rank" />
          <div className="tt-loading-row__copy">
            <Skeleton className="tt-loading-line tt-loading-line--title" />
            <Skeleton className="tt-loading-line tt-loading-line--short" />
          </div>
          <div className="tt-loading-row__scores">
            <Skeleton className="tt-loading-score" />
            <Skeleton className="tt-loading-score" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportPageSkeleton({
  variant = "stores",
  message = "리뷰 신호를 분석하는 중"
}: ReportPageSkeletonProps) {
  const rowCount = variant === "store-detail" ? 3 : variant === "review" ? 2 : 5;

  return (
    <div className="tt-container tt-page tt-loading-page" role="status" aria-live="polite">
      <section className="tt-loading-hero">
        <div>
          <Skeleton className="tt-loading-line tt-loading-line--eyebrow" />
          <Skeleton className="tt-loading-line tt-loading-line--headline" />
          <Skeleton className="tt-loading-line tt-loading-line--body" />
          <p>{message}</p>
        </div>
        <div className="tt-loading-evidence" aria-hidden="true">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </section>
      {variant === "ranking" || variant === "tt-index" ? (
        <div className="tt-loading-metrics">
          {Array.from({ length: variant === "ranking" ? 5 : 3 }, (_, index) => (
            <div key={index}><Skeleton /><Skeleton /><Skeleton /></div>
          ))}
        </div>
      ) : null}
      <SkeletonRows count={rowCount} />
    </div>
  );
}
