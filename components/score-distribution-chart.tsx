import type { ScoreDistributionBucket, ScoreDistributionSummary } from "@/lib/score-distribution";

type ScoreDistributionChartProps = {
  summary: ScoreDistributionSummary;
};

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function DistributionPanel({
  title,
  description,
  buckets,
  averageLabel,
  averageValue,
  markerLabel
}: {
  title: string;
  description: string;
  buckets: ScoreDistributionBucket[];
  averageLabel: string;
  averageValue: number;
  markerLabel?: string;
}) {
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
            {averageLabel}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">
            {formatScore(averageValue)}
          </div>
        </div>
      </div>

      {markerLabel ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
          {markerLabel}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {buckets.map((bucket) => (
          <div key={bucket.range} className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold tabular-nums text-zinc-950">
                  {bucket.range}
                </div>
                <div className="mt-0.5 text-xs font-medium text-zinc-500">{bucket.label}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums text-zinc-950">
                {bucket.count}개 · {bucket.percentage.toFixed(1)}%
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-zinc-950"
                style={{
                  width: `${bucket.count ? Math.max(4, (bucket.count / maxCount) * 100) : 0}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreDistributionChart({ summary }: ScoreDistributionChartProps) {
  return (
    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Distribution Comparison
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            RAW Score와 TT Index 분포 비교
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
            두 분포는 같은 점수 구간으로 비교합니다. RAW Score가 어느 구간에 몰리는지, TT Index가
            평균선 기준으로 어떻게 재정렬되는지 같은 기준에서 확인할 수 있습니다.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
          현재 {summary.storeCount.toLocaleString()}개 매장 기준
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DistributionPanel
          title="RAW Score 분포"
          description="원래 리뷰 점수의 신뢰 가중 평균 기준"
          buckets={summary.rawDistribution}
          averageLabel="RAW 평균"
          averageValue={summary.rawAverage}
        />
        <DistributionPanel
          title="TT Index 분포"
          description="시장 평균 3.0 재정렬 기준"
          buckets={summary.ttDistribution}
          averageLabel="TT 평균"
          averageValue={summary.ttAverage}
          markerLabel={`TT Index ${summary.marketAverageLine.toFixed(1)} = 시장 평균선`}
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        RAW Score와 TT Index는 동일한 구간으로 표시되며, 분포는 현재 데이터와 리뷰 업데이트에 따라
        달라질 수 있습니다.
      </p>
    </section>
  );
}
