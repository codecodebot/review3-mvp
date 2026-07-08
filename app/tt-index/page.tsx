import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { MetricCard } from "@/components/metric-card";
import { ScoreDistributionChart } from "@/components/score-distribution-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStores } from "@/lib/queries";
import { calculateScoreDistributionSummary } from "@/lib/score-distribution";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";

export const dynamic = "force-dynamic";

function average(values: number[]) {
  const safeValues = values.filter((value) => Number.isFinite(value));

  if (!safeValues.length) {
    return 0;
  }

  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function TtIndexPage() {
  let rawScores: number[] = [];
  let ttScores: number[] = [];
  let supabaseIssue: SupabaseIssueKind | null = null;

  try {
    const stores = await getStores();
    const scorePairs = stores
      .map((store) => ({
        rawScore: store.score?.raw_score,
        ttScore: store.score?.adjusted_score
      }))
      .filter(
        (score): score is { rawScore: number; ttScore: number } =>
          typeof score.rawScore === "number" &&
          Number.isFinite(score.rawScore) &&
          typeof score.ttScore === "number" &&
          Number.isFinite(score.ttScore)
      );

    rawScores = scorePairs.map((score) => score.rawScore);
    ttScores = scorePairs.map((score) => score.ttScore);
  } catch (error) {
    supabaseIssue = isSupabaseSetupOrConnectionError(error)
      ? getSupabaseIssueKind(error)
      : "database";
  }

  const distributionSummary = calculateScoreDistributionSummary({ rawScores, ttScores });
  const averageRawScore = average(rawScores);

  return (
    <div className="container py-8 sm:py-12">
      <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            TT Index Methodology
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            TT Index는 일반 별점이 아닙니다
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            RAW Score는 사용자가 남긴 원래 리뷰 점수입니다. TT Index는 RAW Score를 시장 평균
            3.0 기준으로 다시 해석해, 평균보다 얼마나 높은지 또는 낮은지를 보여주는 참고 지표입니다.
          </p>
          <div className="mt-6 inline-flex rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-base font-semibold text-zinc-950">
            3.0은 낮은 점수가 아니라, Trusttable의 시장 평균선입니다.
          </div>
        </div>
      </section>

      {supabaseIssue ? (
        <div className="mt-6">
          <DatabaseSetupNotice kind={supabaseIssue} />
        </div>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Average TT Index" value="3.00" helper="시장 평균선" />
        <MetricCard
          label="Average RAW Score"
          value={formatScore(averageRawScore)}
          helper="신뢰 가중 원점수 평균"
        />
        <MetricCard
          label="Stores Analyzed"
          value={distributionSummary.storeCount.toLocaleString()}
          helper="현재 데이터 기준"
        />
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          What TT Index Means
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          RAW Score를 시장 평균선 위에서 다시 읽습니다
        </h2>
        <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-zinc-700">
          Trusttable은 매장의 별점을 깎기 위한 서비스가 아닙니다. 기존 RAW Score는 그대로 보여주고,
          TT Index는 시장 평균 대비 위치를 해석하는 보조 지표입니다.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-950">RAW Score</div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              사용자가 남긴 원래 리뷰 점수의 신뢰 가중 평균입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-950">시장 평균</div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              현재 비교 대상 매장들의 RAW Score 평균입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-950">TT Index</div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              시장 평균을 3.0으로 맞춘 뒤 각 매장의 상대 위치를 보여줍니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>계산 공식</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-900">
              TT Index = RAW Score - Market Average RAW Score + 3.0
            </div>
            <p className="text-sm leading-6 text-zinc-600">
              예를 들어 시장 평균 RAW가 4.45이고 A매장의 RAW가 4.75라면 TT Index는
              4.75 - 4.45 + 3.0 = 3.30입니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>참고해야 할 점</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleList
              items={[
                "TT Index는 매장의 절대적 우열을 확정하는 점수가 아니라 선택을 돕는 참고 지표입니다.",
                "리뷰 수가 너무 적은 매장은 RAW Score가 높아도 과도하게 높게 평가되지 않을 수 있습니다.",
                "구매 미인증 리뷰는 제외하지 않고 낮은 가중치로 반영합니다.",
                "최근 리뷰 흐름과 리뷰 신뢰 신호를 함께 살펴볼 수 있습니다."
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <div className="mt-6">
        <ScoreDistributionChart summary={distributionSummary} />
      </div>
    </div>
  );
}
