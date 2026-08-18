"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { StoreRankCard } from "@/components/store-rank-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DEFAULT_RECENCY_OPTIONS,
  DEFAULT_SCORE_WEIGHTS,
  calculateAdjustedScore,
  calculateRawAverage,
  calculateRecencyWeightedRawScore,
  calculateRisingStoreSignal,
  normalizeScoreWeights,
  type ScoreWeights
} from "@/lib/scoring";
import type { StoreWithScoreAndReviews } from "@/lib/types";

type RankingTableProps = {
  stores: StoreWithScoreAndReviews[];
};

type RankedStore = StoreWithScoreAndReviews & {
  rawScore: number;
  normalizedScore: number;
  rawAverageDelta: number;
};

const STORAGE_KEY = "trusttable.scoringWeights.v1";
type RankingSortMetric = "tt-index" | "raw-score";

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatSigned(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const sign = safeValue > 0 ? "+" : "";
  return `${sign}${safeValue.toFixed(2)}`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function average(values: number[]) {
  const safeValues = values.filter((value) => Number.isFinite(value));

  if (!safeValues.length) {
    return 0;
  }

  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function weightsToPercents(weights: ScoreWeights) {
  return {
    taste: Math.round(weights.taste * 100),
    service: Math.round(weights.service * 100),
    environment: Math.round(weights.environment * 100)
  };
}

function percentsToWeights(percents: { taste: number; service: number; environment: number }) {
  return normalizeScoreWeights({
    taste: percents.taste,
    service: percents.service,
    environment: percents.environment
  });
}

function parseStoredWeights(value: string | null) {
  if (!value) {
    return DEFAULT_SCORE_WEIGHTS;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ScoreWeights>;
    return normalizeScoreWeights({
      taste: Number(parsed.taste ?? DEFAULT_SCORE_WEIGHTS.taste),
      service: Number(parsed.service ?? DEFAULT_SCORE_WEIGHTS.service),
      environment: Number(parsed.environment ?? DEFAULT_SCORE_WEIGHTS.environment)
    });
  } catch {
    return DEFAULT_SCORE_WEIGHTS;
  }
}

function sortRankedStores(stores: RankedStore[], sortMetric: RankingSortMetric) {
  return [...stores].sort((a, b) => {
    if (sortMetric === "raw-score") {
      return b.rawScore - a.rawScore || b.normalizedScore - a.normalizedScore;
    }

    return b.normalizedScore - a.normalizedScore || b.rawScore - a.rawScore;
  });
}

function getSortLabel(sortMetric: RankingSortMetric) {
  return sortMetric === "raw-score" ? "RAW Score" : "TT Index";
}

function buildRankedStores(stores: StoreWithScoreAndReviews[], weights: ScoreWeights) {
  const scoredStores = stores.filter((store) => (store.score?.review_count ?? 0) >= 5);

  const storesWithRaw = scoredStores.map((store) => {
    const calculatedRaw = calculateRecencyWeightedRawScore(store.ranking_reviews, weights, {
      halfLifeDays: DEFAULT_RECENCY_OPTIONS.halfLifeDays,
      minRecencyWeight: DEFAULT_RECENCY_OPTIONS.minRecencyWeight
    });
    const rawScore = calculatedRaw > 0 ? calculatedRaw : store.score?.raw_score ?? 0;

    return { store, rawScore };
  });

  const rawAverage = calculateRawAverage(storesWithRaw.map((item) => item.rawScore));
  const rankedStores = storesWithRaw.map<RankedStore>(({ store, rawScore }) => {
    const normalizedScore = calculateAdjustedScore({ rawScore, rawAverage });
    const rising = calculateRisingStoreSignal(store.ranking_reviews, weights, {
      halfLifeDays: DEFAULT_RECENCY_OPTIONS.halfLifeDays,
      minRecencyWeight: DEFAULT_RECENCY_OPTIONS.minRecencyWeight
    });

    return {
      ...store,
      rising: {
        isRising: rising.isRising,
        risingDelta: roundTwo(rising.risingDelta),
        recentReviewCount: rising.recentReviewCount
      },
      rawScore,
      normalizedScore,
      rawAverageDelta: rawScore - rawAverage
    };
  });

  return { rankedStores, rawAverage };
}

function ScoringWeightsPanel({
  weights,
  onChange
}: {
  weights: ScoreWeights;
  onChange: (weights: ScoreWeights) => void;
}) {
  const percents = weightsToPercents(weights);

  function updateWeight(key: keyof ScoreWeights, value: number) {
    const clampedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    onChange(
      percentsToWeights({
        ...percents,
        [key]: clampedValue
      })
    );
  }

  const controls = [
    { key: "taste" as const, label: "맛", value: percents.taste },
    { key: "service" as const, label: "서비스", value: percents.service },
    { key: "environment" as const, label: "분위기", value: percents.environment }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="tt-ranking-toolbar">
          <div>
            <p className="tt-kicker">
              Scoring Weights
            </p>
            <CardTitle>평가 항목 반영 비율</CardTitle>
          </div>
          <p className="tt-card-description">
            비율은 자동으로 100%로 정규화됩니다. 설정은 이 브라우저에 저장됩니다.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="tt-weights-grid">
          {controls.map((control) => (
            <div key={control.key} className="tt-weight-control">
              <div className="tt-weight-control__top">
                <label className="tt-label" htmlFor={control.key}>
                  {control.label}
                </label>
                <span className="tt-weight-control__value">
                  {control.value}%
                </span>
              </div>
              <Input
                id={control.key}
                type="range"
                min={0}
                max={100}
                value={control.value}
                onChange={(event) => updateWeight(control.key, Number(event.target.value))}
                className="tt-range"
              />
            </div>
          ))}
        </div>
        <div className="tt-method-grid">
          <div className="tt-method-chip">
            <div className="tt-method-chip__title">최근 리뷰 가중</div>
            <p>
              Half-life {DEFAULT_RECENCY_OPTIONS.halfLifeDays}일 기준으로 최근 리뷰를 더 크게 반영합니다.
            </p>
          </div>
          <div className="tt-method-chip">
            <div className="tt-method-chip__title">구매 인증 가중</div>
            <p>
              구매 미인증 리뷰는 제외하지 않고 낮은 가중치로 반영합니다.
            </p>
          </div>
          <div className="tt-method-chip">
            <div className="tt-method-chip__title">TT Index 평균선</div>
            <p>
              모든 매장의 TT Index는 시장 평균 3.0을 중심으로 정렬됩니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSummary({
  stores,
  rawAverage
}: {
  stores: RankedStore[];
  rawAverage: number;
}) {
  const averageTtIndex = average(stores.map((store) => store.normalizedScore));
  const averageRaw = average(stores.map((store) => store.rawScore));
  const allReviews = stores.flatMap((store) => store.ranking_reviews);
  const verifiedReviewRatio = allReviews.length
    ? allReviews.filter((review) => review.purchase_verified !== false).length / allReviews.length
    : 0;
  const risingCount = stores.filter((store) => store.rising?.isRising).length;
  const inflationGap = averageRaw - averageTtIndex;

  return (
    <div className="tt-metric-grid">
      <MetricCard label="Average TT Index" value={formatScore(averageTtIndex)} helper="시장 평균 3.0 기준" />
      <MetricCard label="Average RAW Score" value={formatScore(rawAverage)} helper="최근·구매인증 가중 적용" />
      <MetricCard label="Inflation Gap" value={formatSigned(inflationGap)} helper="RAW와 TT 평균 차이" />
      <MetricCard label="Verified Reviews" value={formatPercent(verifiedReviewRatio)} helper="구매 인증 리뷰 비율" />
      <MetricCard label="Stores Analyzed" value={stores.length.toLocaleString()} helper={`상승 신호 ${risingCount}개`} />
    </div>
  );
}

function TopStoreBrief({
  sortMetric,
  store
}: {
  sortMetric: RankingSortMetric;
  store: RankedStore;
}) {
  const sortLabel = getSortLabel(sortMetric);
  const primaryScore = sortMetric === "raw-score" ? store.rawScore : store.normalizedScore;

  return (
    <Card className="tt-leader-card">
      <CardContent>
        <div>
          <p className="tt-kicker">
            Current Leader
          </p>
          <h2 className="tt-section-title">
            #1 {store.name}
          </h2>
          <p className="tt-card-description">
            현재 선택한 {sortLabel} 기준으로 가장 높은 매장입니다. RAW Score와 TT Index는 항상 함께
            비교할 수 있습니다.
          </p>
        </div>
        <div className="tt-leader-card__score">
          <div className="tt-kicker">
            {sortLabel}
          </div>
          <div className="tt-leader-card__value">
            {formatScore(primaryScore)}
          </div>
          <div className="tt-leader-card__meta">
            <span>RAW Score {formatScore(store.rawScore)}</span>
            <span>평균 대비 {formatSigned(store.rawAverageDelta)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreComparisonChart({ stores }: { stores: RankedStore[] }) {
  const previewStores = stores.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>RAW Score와 TT Index 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="tt-comparison-chart">
        {previewStores.map((store) => (
          <div key={store.id} className="tt-chart-row">
            <div>
              <div className="tt-chart-title">{store.name}</div>
              <div className="tt-chart-sub">TT {formatScore(store.normalizedScore)}</div>
            </div>
            <div className="tt-chart-bars">
              <div className="tt-chart-track">
                <div
                  className="tt-chart-fill"
                  style={{ width: `${Math.max(0, Math.min(100, (store.rawScore / 5) * 100))}%` }}
                />
              </div>
              <div className="tt-chart-track">
                <div
                  className="tt-chart-fill tt-chart-fill--tt"
                  style={{
                    width: `${Math.max(0, Math.min(100, (store.normalizedScore / 5) * 100))}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="tt-chart-legend">
          <span>
            <i aria-hidden="true" />
            RAW Score
          </span>
          <span>
            <i aria-hidden="true" />
            TT Index
          </span>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MethodologyCard() {
  const labels = [
    "구매 인증 리뷰는 더 높게 반영",
    "구매 미인증 리뷰는 낮은 가중치 적용",
    "최근 리뷰 흐름 반영",
    "모든 매장은 TT Index 3.0 평균선 기준 정렬"
  ];

  return (
    <Card>
      <CardHeader>
        <p className="tt-kicker">
          Methodology
        </p>
        <CardTitle>Trusttable 점수 계산 방식</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="tt-formula">
          TT Index = Store RAW Score - Market Average RAW Score + 3.0
          <br />
          RAW Score includes recency, purchase verification, and reliability weights
        </div>
        <div className="tt-chip-row" style={{ marginTop: 16 }}>
          {labels.map((label) => (
            <div
              key={label}
              className="tt-badge tt-badge--muted"
            >
              {label}
            </div>
          ))}
        </div>
        <p className="tt-card-description" style={{ marginTop: 16 }}>
          Trusttable은 RAW Score를 숨기지 않습니다. RAW Score를 먼저 계산한 뒤 전체 매장 평균을
          기준으로 3.0 주변에 정렬합니다.
        </p>
      </CardContent>
    </Card>
  );
}

export function RankingTable({ stores }: RankingTableProps) {
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS);
  const [sortMetric, setSortMetric] = useState<RankingSortMetric>("tt-index");
  const [hasLoadedStoredWeights, setHasLoadedStoredWeights] = useState(false);

  useEffect(() => {
    setWeights(parseStoredWeights(window.localStorage.getItem(STORAGE_KEY)));
    setHasLoadedStoredWeights(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredWeights) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
  }, [hasLoadedStoredWeights, weights]);

  const { rankedStores: calculatedStores, rawAverage } = useMemo(
    () => buildRankedStores(stores, weights),
    [stores, weights]
  );
  const rankedStores = useMemo(
    () => sortRankedStores(calculatedStores, sortMetric),
    [calculatedStores, sortMetric]
  );
  const sortLabel = getSortLabel(sortMetric);

  if (!rankedStores.length) {
    return (
      <div className="tt-rank-layout">
        <ScoringWeightsPanel weights={weights} onChange={setWeights} />
        <div className="tt-empty-state">
          아직 랭킹에 표시할 만큼 리뷰가 충분한 매장이 없습니다.
        </div>
      </div>
    );
  }

  const leader = rankedStores[0];

  return (
    <div className="tt-rank-layout">
      <TopStoreBrief store={leader} sortMetric={sortMetric} />
      <DashboardSummary stores={rankedStores} rawAverage={rawAverage} />
      <ScoringWeightsPanel weights={weights} onChange={setWeights} />
      <div className="tt-side-layout">
        <div className="tt-stack">
          <div className="tt-ranking-toolbar">
            <div>
              <p className="tt-kicker">
                Store Ranking
              </p>
              <h2 className="tt-section-title">
                {sortLabel} 기준 상위 매장
              </h2>
              <p className="tt-card-description">
                TT Index와 RAW Score를 모두 보여주되, 선택한 기준으로 순위를 다시 정렬합니다.
              </p>
            </div>
            <label className="tt-field tt-ranking-toolbar__select">
              <span className="tt-label">정렬 기준</span>
              <Select
                value={sortMetric}
                onChange={(event) => setSortMetric(event.target.value as RankingSortMetric)}
                aria-label="랭킹 정렬 기준"
              >
                <option value="tt-index">TT Index</option>
                <option value="raw-score">RAW Score</option>
              </Select>
            </label>
          </div>
          <div className="tt-stack">
            {rankedStores.map((store, index) => (
              <StoreRankCard key={store.id} store={store} rank={index + 1} weights={weights} />
            ))}
          </div>
        </div>
        <aside className="tt-stack">
          <ScoreComparisonChart stores={rankedStores} />
          <MethodologyCard />
        </aside>
      </div>
    </div>
  );
}
