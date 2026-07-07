"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RisingStoreBadge } from "@/components/rising-store-badge";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import type { StoreWithScoreAndReviews } from "@/lib/types";
import { cn } from "@/lib/utils";

type RankingTableProps = {
  stores: StoreWithScoreAndReviews[];
};

type RankedStore = StoreWithScoreAndReviews & {
  rawScore: number;
  normalizedScore: number;
  rawAverageDelta: number;
};

type TrustLevel = "unknown" | "low" | "medium" | "high";

const STORAGE_KEY = "trusttable.scoringWeights.v1";

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDelta(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const sign = safeValue > 0 ? "+" : "";
  return `${sign}${safeValue.toFixed(2)}`;
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "데이터 부족";
  }

  return `${Math.round(value * 100)}%`;
}

function trustLabel(level: TrustLevel) {
  if (level === "high") {
    return "높음";
  }

  if (level === "medium") {
    return "보통";
  }

  if (level === "low") {
    return "낮음";
  }

  return "알 수 없음";
}

function verificationLabel(status: string | null | undefined) {
  if (status === "verified") {
    return "인증됨";
  }

  if (status === "rejected") {
    return "거절됨";
  }

  return "확인 중";
}

function average(values: number[]) {
  const safeValues = values.filter((value) => Number.isFinite(value));

  if (!safeValues.length) {
    return 0;
  }

  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function toTrustLevel(value: string | null | undefined): TrustLevel {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "unknown";
}

function deltaClass(delta: number) {
  if (delta > 0.05) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (delta < -0.05) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

function trustClass(level: TrustLevel) {
  if (level === "high") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (level === "low") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function verificationClass(status: string | null | undefined) {
  if (status === "verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function barWidthForScore(score: number) {
  const percent = Math.max(0, Math.min(100, ((score - 1) / 4) * 100));
  return `${Math.round(percent * 10) / 10}%`;
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Scoring Weights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {controls.map((control) => (
            <div key={control.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-zinc-800" htmlFor={control.key}>
                  {control.label}
                </label>
                <span className="text-sm font-bold tabular-nums text-zinc-950">
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
                className="h-9 px-0"
              />
            </div>
          ))}
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600">
          최근 리뷰 가중치가 적용 중입니다. Half-life 기준은 최근{" "}
          {DEFAULT_RECENCY_OPTIONS.halfLifeDays}일이며, 오래된 리뷰도 최소{" "}
          {Math.round(DEFAULT_RECENCY_OPTIONS.minRecencyWeight * 100)}%는 반영됩니다. 구매 미인증
          리뷰는 점수 계산에서 낮은 가중치로 반영됩니다. 설정은 이 브라우저에 저장됩니다.
        </div>
      </CardContent>
    </Card>
  );
}

function RankingSummary({ stores, rawAverage }: { stores: RankedStore[]; rawAverage: number }) {
  const totalStores = stores.length;
  const totalReviews = stores.reduce((sum, store) => sum + (store.score?.review_count ?? 0), 0);
  const averageNormalized = average(stores.map((store) => store.normalizedScore));
  const averageShift = average(stores.map((store) => store.normalizedScore - store.rawScore));
  const verifiedCount = stores.filter((store) => store.verification_status === "verified").length;
  const verifiedRate = totalStores ? verifiedCount / totalStores : 0;
  const repeatAverage = average(
    stores
      .map((store) => store.score?.revisit_rate)
      .filter((value): value is number => typeof value === "number")
  );
  const trustCounts = stores.reduce(
    (counts, store) => {
      const level = toTrustLevel(store.score?.trust_level);
      counts[level] += 1;
      return counts;
    },
    { unknown: 0, low: 0, medium: 0, high: 0 } satisfies Record<TrustLevel, number>
  );

  const items = [
    { label: "평균 원점수", value: formatScore(rawAverage) },
    { label: "평균 보정 점수", value: formatScore(averageNormalized) },
    { label: "평균 보정 차이", value: formatDelta(averageShift) },
    { label: "인증 매장", value: `${Math.round(verifiedRate * 100)}%` },
    { label: "매장 수", value: totalStores.toLocaleString() },
    { label: "리뷰 수", value: totalReviews.toLocaleString() },
    { label: "평균 재방문", value: formatPercent(repeatAverage) },
    {
      label: "신뢰도 분포",
      value: `높음 ${trustCounts.high} / 보통 ${trustCounts.medium} / 낮음 ${trustCounts.low}`
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="text-xs font-medium text-zinc-500">{item.label}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums leading-8 text-zinc-950">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreComparisonChart({ stores }: { stores: RankedStore[] }) {
  const previewStores = stores.slice(0, 12);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">원점수 vs 보정 점수</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {previewStores.map((store) => (
          <div key={store.id} className="grid gap-2 sm:grid-cols-[minmax(140px,1fr)_2fr]">
            <div className="truncate text-sm font-medium">{store.name}</div>
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-sky-400"
                  style={{ width: barWidthForScore(store.rawScore) }}
                />
              </div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: barWidthForScore(store.normalizedScore) }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded-full bg-sky-400" />
            원점수
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded-full bg-emerald-400" />
            보정 점수
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreHistogram({ stores }: { stores: RankedStore[] }) {
  const bins = [
    { label: "1.0", min: 1, max: 1.5 },
    { label: "1.5", min: 1.5, max: 2 },
    { label: "2.0", min: 2, max: 2.5 },
    { label: "2.5", min: 2.5, max: 3 },
    { label: "3.0", min: 3, max: 3.5 },
    { label: "3.5", min: 3.5, max: 4 },
    { label: "4.0", min: 4, max: 4.5 },
    { label: "4.5", min: 4.5, max: 5.01 }
  ];
  const counts = bins.map((bin) => ({
    ...bin,
    count: stores.filter((store) => store.normalizedScore >= bin.min && store.normalizedScore < bin.max)
      .length
  }));
  const maxCount = Math.max(1, ...counts.map((bin) => bin.count));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">보정 점수 분포</CardTitle>
      </CardHeader>
      <CardContent className="flex h-48 items-end gap-2">
        {counts.map((bin) => (
          <div key={bin.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="text-xs font-medium">{bin.count}</div>
            <div className="flex h-32 w-full items-end rounded bg-zinc-100">
              <div
                className="w-full rounded bg-emerald-400"
                style={{ height: bin.count ? `${Math.max(4, (bin.count / maxCount) * 100)}%` : "0%" }}
              />
            </div>
            <div className="text-xs text-muted-foreground">{bin.label}</div>
          </div>
        ))}
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
      <div className="space-y-5">
        <ScoringWeightsPanel weights={weights} onChange={setWeights} />
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
          아직 랭킹에 표시할 만큼 리뷰가 충분한 매장이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScoringWeightsPanel weights={weights} onChange={setWeights} />
      <RankingSummary stores={rankedStores} rawAverage={rawAverage} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ScoreComparisonChart stores={rankedStores} />
        <ScoreHistogram stores={rankedStores} />
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                <TableHead className="w-14">순위</TableHead>
                <TableHead>매장</TableHead>
                <TableHead className="min-w-56">점수</TableHead>
                <TableHead>차이</TableHead>
                <TableHead>리뷰 수</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedStores.map((store, index) => {
                const trustLevel = toTrustLevel(store.score?.trust_level);
                const verificationStatus = store.verification_status ?? "pending";

                return (
                  <TableRow key={store.id}>
                    <TableCell className="py-3 text-base font-bold tabular-nums text-zinc-950">
                      {index + 1}
                    </TableCell>
                    <TableCell className="py-2">
                      <Link
                        className="font-semibold text-zinc-950 hover:text-blue-600"
                        href={`/stores/${store.id}`}
                      >
                        {store.name}
                      </Link>
                      <div className="mt-1 text-xs font-medium text-zinc-500">
                        {formatRegionLabel(store.region)} / {formatCategoryLabel(store.category)}
                      </div>
                      {store.rising?.isRising ? (
                        <div className="mt-2">
                          <RisingStoreBadge rising={store.rising} compact />
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-2">
                      <StarRating value={store.normalizedScore} size="sm" label="보정 점수" />
                      <div className="mt-1 text-xs font-medium text-zinc-500">
                        원점수 {formatScore(store.rawScore)} · 리뷰 {store.score?.review_count ?? 0}개
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
                          최신 리뷰 가중
                        </Badge>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-zinc-100">
                        <div
                          className="h-2 rounded-full bg-emerald-400"
                          style={{ width: barWidthForScore(store.normalizedScore) }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className={cn(deltaClass(store.rawAverageDelta))}>
                        평균 대비 {formatDelta(store.rawAverageDelta)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="font-semibold tabular-nums text-zinc-950">
                        {store.score?.review_count ?? 0}
                      </div>
                      <Badge variant="outline" className="mt-1 border-sky-200 bg-sky-50 text-sky-700">
                        재방문 {formatPercent(store.score?.revisit_rate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={verificationClass(verificationStatus)}>
                          {verificationLabel(verificationStatus)}
                        </Badge>
                        <Badge variant="outline" className={trustClass(trustLevel)}>
                          신뢰도 {trustLabel(trustLevel)}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
