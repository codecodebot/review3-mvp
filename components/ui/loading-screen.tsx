import Image from "next/image";
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
    <div className={cn("container py-8 sm:py-12", className)} role="status" aria-live="polite">
      <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-5">
            <div className="inline-flex rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <Image
                src="/brand/trusttable-logo.png"
                alt="Trusttable"
                width={160}
                height={160}
                priority
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Loading Review Signals
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                {message}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                RAW Score, TT Index, 리뷰 신호를 불러오고 있습니다.
              </p>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-4/5 rounded-full" />
            <Skeleton className="h-2 w-2/3 rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
