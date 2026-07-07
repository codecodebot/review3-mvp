import Link from "next/link";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { calculateAdjustedScore, calculateRawAverage } from "@/lib/scoring";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import type { StoreWithScore } from "@/lib/types";
import { cn } from "@/lib/utils";

type RankingTableProps = {
  stores: StoreWithScore[];
};

type RankedStore = StoreWithScore & {
  rawScore: number;
  normalizedScore: number;
  rawAverageDelta: number;
};

type TrustLevel = "unknown" | "low" | "medium" | "high";

function formatScore(value: number) {
  return value.toFixed(2);
}

function formatDelta(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
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
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function buildRankedStores(stores: StoreWithScore[]) {
  const scoredStores = stores.filter((store) => typeof store.score?.raw_score === "number");
  const rawAverage = calculateRawAverage(scoredStores.map((store) => store.score?.raw_score ?? 0));

  const rankedStores = scoredStores
    .map<RankedStore>((store) => {
      const rawScore = store.score?.raw_score ?? 0;
      const normalizedScore = calculateAdjustedScore({ rawScore, rawAverage });

      return {
        ...store,
        rawScore,
        normalizedScore,
        rawAverageDelta: rawScore - rawAverage
      };
    })
    .sort((a, b) => b.normalizedScore - a.normalizedScore);

  return { rankedStores, rawAverage };
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
  const { rankedStores, rawAverage } = buildRankedStores(stores);

  if (!rankedStores.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        아직 랭킹에 표시할 만큼 리뷰가 충분한 매장이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
                    </TableCell>
                    <TableCell className="py-2">
                      <StarRating value={store.normalizedScore} size="sm" label="보정 점수" />
                      <div className="mt-1 text-xs font-medium text-zinc-500">
                        원점수 {formatScore(store.rawScore)} · 리뷰 {store.score?.review_count ?? 0}개
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
