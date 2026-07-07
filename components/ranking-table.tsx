"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { StoreRankCard } from "@/components/store-rank-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const rankedStores = storesWithRaw
    .map<RankedStore>(({ store, rawScore }) => {
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
    })
    .sort((a, b) => b.normalizedScore - a.normalizedScore);

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
    { key: "taste" as const, label: "Taste", value: percents.taste },
    { key: "service" as const, label: "Service", value: percents.service },
    { key: "environment" as const, label: "Environment", value: percents.environment }
  ];

  return (
    <Card className="border-zinc-200/80">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
              Scoring Weights
            </p>
            <CardTitle className="mt-2">평가 항목 반영 비율</CardTitle>
          </div>
          <p className="max-w-xl text-sm leading-6 text-zinc-500">
            비율은 자동으로 100%로 정규화됩니다. 설정은 이 브라우저에 저장됩니다.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-3">
          {controls.map((control) => (
            <div key={control.key} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-zinc-900" htmlFor={control.key}>
                  {control.label}
                </label>
                <span className="text-sm font-semibold tabular-nums text-zinc-950">
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
                className="mt-4 h-9 px-0 accent-zinc-950"
              />
            </div>
          ))}
        </div>
        <div className="grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="font-semibold text-zinc-950">최근 리뷰 가중</div>
            <p className="mt-1 leading-6">
              Half-life {DEFAULT_RECENCY_OPTIONS.halfLifeDays}일 기준으로 최근 리뷰를 더 크게 반영합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="font-semibold text-zinc-950">구매 인증 가중</div>
            <p className="mt-1 leading-6">
              구매 미인증 리뷰는 제외하지 않고 낮은 가중치로 반영합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="font-semibold text-zinc-950">시장 평균 보정</div>
            <p className="mt-1 leading-6">
              모든 매장의 보정 점수는 시장 평균 3.0을 중심으로 정렬됩니다.
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
  const averageAdjusted = average(stores.map((store) => store.normalizedScore));
  const averageRaw = average(stores.map((store) => store.rawScore));
  const allReviews = stores.flatMap((store) => store.ranking_reviews);
  const verifiedReviewRatio = allReviews.length
    ? allReviews.filter((review) => review.purchase_verified !== false).length / allReviews.length
    : 0;
  const risingCount = stores.filter((store) => store.rising?.isRising).length;
  const inflationGap = averageRaw - averageAdjusted;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Average Adjusted"
        value={formatScore(averageAdjusted)}
        helper="시장 평균 3.0 기준"
      />
      <MetricCard label="Average Raw" value={formatScore(rawAverage)} helper="최근성·인증 가중 적용" />
      <MetricCard
        label="Inflation Gap"
        value={formatSigned(inflationGap)}
        helper="원점수와 보정 평균 차이"
      />
      <MetricCard
        label="Verified Reviews"
        value={formatPercent(verifiedReviewRatio)}
        helper="구매 인증 리뷰 비율"
      />
      <MetricCard
        label="Stores Analyzed"
        value={stores.length.toLocaleString()}
        helper={`상승 신호 ${risingCount}개`}
      />
    </div>
  );
}

function TopStoreBrief({ store }: { store: RankedStore }) {
  return (
    <Card className="overflow-hidden border-zinc-200/80 bg-zinc-950 text-white">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Current Leader
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            #{1} {store.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            보정 점수 기준 현재 가장 높은 매장입니다. 원점수, 구매 인증 가중치, 최근 리뷰 흐름을
            함께 반영했습니다.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Adjusted Score
          </div>
          <div className="mt-2 text-5xl font-semibold tabular-nums tracking-tight text-white">
            {formatScore(store.normalizedScore)}
          </div>
          <div className="mt-3 flex justify-between text-sm text-zinc-300">
            <span>Raw {formatScore(store.rawScore)}</span>
            <span>Market {formatSigned(store.rawAverageDelta)}</span>
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
      <CardHeader className="pb-4">
        <CardTitle>원점수와 보정 점수 비교</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewStores.map((store) => (
          <div key={store.id} className="grid gap-2 sm:grid-cols-[minmax(160px,1fr)_2fr]">
            <div>
              <div className="truncate text-sm font-semibold text-zinc-950">{store.name}</div>
              <div className="text-xs text-zinc-500">보정 {formatScore(store.normalizedScore)}</div>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-zinc-100">
                <div
                  className="h-1.5 rounded-full bg-zinc-400"
                  style={{ width: `${Math.max(0, Math.min(100, (store.rawScore / 5) * 100))}%` }}
                />
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100">
                <div
                  className="h-1.5 rounded-full bg-zinc-950"
                  style={{
                    width: `${Math.max(0, Math.min(100, (store.normalizedScore / 5) * 100))}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-4 text-xs font-medium text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-zinc-400" />
            원점수
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-zinc-950" />
            보정 점수
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function MethodologyCard() {
  const labels = [
    "Verified reviews weighted higher",
    "Unverified reviews weighted lower",
    "Recent review trend considered",
    "All stores normalized around market average 3.0"
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          Methodology
        </p>
        <CardTitle className="mt-2">How Trusttable calculates scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-6 text-zinc-800">
          adjusted score = raw score normalized around 3.0 + review recency weight +
          verification weight + reliability penalty
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {labels.map((label) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
            >
              {label}
            </div>
          ))}
        </div>
        <p className="text-sm leading-6 text-zinc-500">
          Trusttable은 원점수를 숨기지 않습니다. 원점수를 먼저 계산한 뒤 전체 매장 평균을 기준으로
          3.0 주변에 정규화하고, 리뷰 최신성·구매 인증·사용자 신뢰 패턴을 명확한 규칙으로 반영합니다.
        </p>
      </CardContent>
    </Card>
  );
}

export function RankingTable({ stores }: RankingTableProps) {
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS);
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

  const { rankedStores, rawAverage } = useMemo(
    () => buildRankedStores(stores, weights),
    [stores, weights]
  );

  if (!rankedStores.length) {
    return (
      <div className="space-y-6">
        <ScoringWeightsPanel weights={weights} onChange={setWeights} />
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          아직 랭킹에 표시할 만큼 리뷰가 충분한 매장이 없습니다.
        </div>
      </div>
    );
  }

  const leader = rankedStores[0];

  return (
    <div className="space-y-6">
      <TopStoreBrief store={leader} />
      <DashboardSummary stores={rankedStores} rawAverage={rawAverage} />
      <ScoringWeightsPanel weights={weights} onChange={setWeights} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                Store Ranking
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
                보정 점수 기준 상위 매장
              </h2>
            </div>
            <p className="hidden text-sm text-zinc-500 sm:block">
              원점수와 보정 점수를 항상 함께 표시합니다.
            </p>
          </div>
          <div className="space-y-3">
            {rankedStores.map((store, index) => (
              <StoreRankCard key={store.id} store={store} rank={index + 1} weights={weights} />
            ))}
          </div>
        </div>
        <aside className="space-y-6">
          <ScoreComparisonChart stores={rankedStores} />
          <MethodologyCard />
        </aside>
      </div>
    </div>
  );
}
