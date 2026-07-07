import type { ScoreDistributionBucket } from "@/lib/score-distribution";

type ScoreDistributionChartProps = {
  buckets: ScoreDistributionBucket[];
  totalStores: number;
  isSample?: boolean;
};

export function ScoreDistributionChart({
  buckets,
  totalStores,
  isSample = false
}: ScoreDistributionChartProps) {
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Distribution
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            TT Score 분포
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
            분포는 현재 매장들을 TT Score 구간별로 묶어 보여줍니다. 대부분의 매장은 시장 평균선
            근처에 위치하고, 평균보다 확실히 높은 신호를 보이는 매장은 더 드물게 나타납니다.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
          전체 {totalStores.toLocaleString()}개 매장 기준
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
          <span>TT Score 3.0 = 시장 평균선</span>
          <span>{isSample ? "대표 샘플 기준" : "현재 Trusttable 데이터 기준"}</span>
        </div>
        <div className="mt-4 space-y-3">
          {buckets.map((bucket) => (
            <div
              key={bucket.range}
              className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-[110px_170px_minmax(160px,1fr)_96px] sm:items-center"
            >
              <div className="text-sm font-semibold tabular-nums text-zinc-950">
                {bucket.range}
              </div>
              <div className="text-sm font-medium text-zinc-600">{bucket.label}</div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-zinc-950"
                  style={{
                    width: `${bucket.count ? Math.max(4, (bucket.count / maxCount) * 100) : 0}%`
                  }}
                />
              </div>
              <div className="text-right text-sm font-semibold tabular-nums text-zinc-950">
                {bucket.count}개 · {bucket.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        분포는 현재 데이터 기준으로 계산되며, 리뷰 수와 데이터 업데이트에 따라 달라질 수
        있습니다.
      </p>
    </section>
  );
}
