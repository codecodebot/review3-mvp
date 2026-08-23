import { BrandMark } from "@/components/brand-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingScreenProps = {
  message?: string;
  className?: string;
};

export function LoadingScreen({
  message = "신뢰도 데이터를 정리하는 중",
  className
}: LoadingScreenProps) {
  return (
    <div className={cn("tt-container tt-page tt-loading-page", className)} role="status" aria-live="polite">
      <section className="tt-loading-screen">
        <div className="tt-loading-screen__inner">
          <div className="tt-loading-screen__copy">
            <BrandMark />
            <div>
              <p className="tt-kicker">Review analysis</p>
              <h1>{message}</h1>
              <p>RAW Score, TT Index, 리뷰 근거를 순서대로 확인하고 있습니다.</p>
            </div>
          </div>
          <div className="tt-loading-screen__signals" aria-hidden="true">
            <Skeleton /><Skeleton /><Skeleton />
          </div>
        </div>
        <div className="tt-loading-progress" aria-hidden="true"><span /></div>
      </section>
    </div>
  );
}
