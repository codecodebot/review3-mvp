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
    <div className="tt-distribution-panel">
      <div className="tt-distribution-panel__header">
        <div>
          <h3 className="tt-distribution-panel__title">{title}</h3>
          <p className="tt-distribution-panel__description">{description}</p>
        </div>
        <div className="tt-distribution-panel__average">
          <div className="tt-distribution-panel__average-label">
            {averageLabel}
          </div>
          <div className="tt-distribution-panel__average-value">
            {formatScore(averageValue)}
          </div>
        </div>
      </div>

      {markerLabel ? (
        <div className="tt-distribution-marker">
          {markerLabel}
        </div>
      ) : null}

      <div className="tt-distribution-list">
        {buckets.map((bucket) => (
          <div key={bucket.range} className="tt-distribution-row">
            <div className="tt-distribution-row__top">
              <div>
                <div className="tt-distribution-row__range">
                  {bucket.range}
                </div>
                <div className="tt-distribution-row__label">{bucket.label}</div>
              </div>
              <div className="tt-distribution-row__count">
                {bucket.count}개 · {bucket.percentage.toFixed(1)}%
              </div>
            </div>
            <div className="tt-progress" style={{ marginTop: 12 }}>
              <div
                className="tt-progress__fill"
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
    <section className="tt-distribution-section">
      <div className="tt-distribution-header">
        <div>
          <p className="tt-kicker">
            Distribution Comparison
          </p>
          <h2 className="tt-section-title" style={{ marginTop: 10 }}>
            RAW Score와 TT Index 분포 비교
          </h2>
          <p className="tt-card-description" style={{ maxWidth: 760, marginTop: 10 }}>
            두 분포는 같은 점수 구간으로 비교합니다. RAW Score가 어느 구간에 몰리는지, TT Index가
            평균선 기준으로 어떻게 재정렬되는지 같은 기준에서 확인할 수 있습니다.
          </p>
        </div>
        <div className="tt-badge tt-badge--muted">
          현재 {summary.storeCount.toLocaleString()}개 매장 기준
        </div>
      </div>

      <div className="tt-distribution-grid">
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

      <p className="tt-distribution-note">
        RAW Score와 TT Index는 동일한 구간으로 표시되며, 분포는 현재 데이터와 리뷰 업데이트에 따라
        달라질 수 있습니다.
      </p>
    </section>
  );
}
