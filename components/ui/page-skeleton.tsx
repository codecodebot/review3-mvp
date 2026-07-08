import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageSkeletonProps = {
  variant?: "stores" | "ranking" | "store-detail" | "tt-index" | "review";
  message?: string;
};

function HeroSkeleton({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-10 w-full max-w-3xl sm:h-12" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-4 w-3/4 max-w-xl" />
      <p className="mt-5 text-sm font-medium text-zinc-500">{message}</p>
    </div>
  );
}

function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.035)]"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function ScoreBlockSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-3 h-4 w-28" />
        </div>
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-3 h-4 w-28" />
        </div>
      </div>
      <Skeleton className="mt-4 h-2 w-full rounded-full" />
    </div>
  );
}

function StoreCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-zinc-200/80 bg-white p-5", compact && "p-4")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-5">
        <ScoreBlockSkeleton />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  );
}

function RankingRowSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5">
      <div className="grid gap-5 lg:grid-cols-[72px_minmax(0,1fr)_300px] lg:items-center">
        <div>
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <Skeleton className="mt-3 h-9 w-24 rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-3 w-44" />
          <Skeleton className="mt-4 h-4 w-full max-w-xl" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <ScoreBlockSkeleton />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-3 h-7 w-72" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, panelIndex) => (
          <div key={panelIndex} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <Skeleton className="h-5 w-36" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 6 }, (_, rowIndex) => (
                <div key={rowIndex} className="rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="mt-3 h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}

export function PageSkeleton({
  variant = "stores",
  message = "리뷰 신호를 분석하는 중"
}: PageSkeletonProps) {
  if (variant === "ranking") {
    return (
      <div className="container space-y-6 py-8 sm:py-12" role="status" aria-live="polite">
        <HeroSkeleton message="TT Index를 불러오는 중" />
        <MetricGridSkeleton count={5} />
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <RankingRowSkeleton key={index} />
            ))}
          </div>
          <div className="space-y-6">
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "store-detail") {
    return (
      <div className="container space-y-6 py-8" role="status" aria-live="polite">
        <HeroSkeleton message="매장 리뷰 신호를 불러오는 중" />
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <StoreCardSkeleton />
          <StoreCardSkeleton compact />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <ReviewCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "tt-index") {
    return (
      <div className="container space-y-6 py-8 sm:py-12" role="status" aria-live="polite">
        <HeroSkeleton message="분포 데이터를 정리하는 중" />
        <MetricGridSkeleton count={3} />
        <ChartSkeleton />
      </div>
    );
  }

  if (variant === "review") {
    return (
      <div className="container space-y-6 py-8" role="status" aria-live="polite">
        <HeroSkeleton message="리뷰 작성 화면을 준비하는 중" />
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-8 sm:py-10" role="status" aria-live="polite">
      <HeroSkeleton message={message} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <StoreCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
