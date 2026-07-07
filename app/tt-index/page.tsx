import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { MetricCard } from "@/components/metric-card";
import { ScoreDistributionChart } from "@/components/score-distribution-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStores } from "@/lib/queries";
import {
  calculateScoreDistribution,
  representativeTtScores
} from "@/lib/score-distribution";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";

export const dynamic = "force-dynamic";

const calculationSteps = [
  {
    title: "1. Review Detail Scores",
    body: "각 리뷰는 taste_score, service_score, environment_score 세 항목을 따로 받습니다."
  },
  {
    title: "2. Review Score",
    body: "현재 MVP 기본 비율은 맛 50%, 서비스 25%, 분위기 25%입니다."
  },
  {
    title: "3. Review Weight",
    body: "리뷰 품질, 리뷰어 신뢰도, 최근성, 구매 인증 여부가 리뷰별 영향력을 조정합니다."
  },
  {
    title: "4. RAW Score",
    body: "각 리뷰 점수에 가중치를 곱해 매장의 신뢰 가중 원점수를 계산합니다."
  },
  {
    title: "5. Market Average RAW Score",
    body: "현재 랭킹 데이터셋에 포함된 매장들의 RAW Score 평균을 기준선으로 사용합니다."
  },
  {
    title: "6. TT Score",
    body: "시장 평균 RAW Score를 TT Score 3.0으로 맞춘 뒤 각 매장의 위치를 표시합니다."
  },
  {
    title: "7. Display & Ranking",
    body: "화면에는 RAW Score와 TT Score를 함께 보여주며, 랭킹은 TT Score 기준으로 정렬합니다."
  }
];

const reflectedRows = [
  ["review_score", "맛·서비스·분위기 세부 점수로 계산되는 리뷰 기본 점수"],
  ["quality_weight", "리뷰 길이, 사진, 고득점 사유 등 리뷰 품질 신호"],
  ["user_weight / trust_score", "리뷰어의 작성 이력과 신뢰 통계"],
  ["recency_weight", "최근 리뷰를 더 크게 반영하는 시간 가중치"],
  ["purchase_verified", "구매 미인증 리뷰는 낮은 가중치로 반영"],
  ["final_weight", "리뷰가 RAW Score에 반영되는 최종 영향력"],
  ["raw_score", "가중치가 반영된 매장 원점수"]
];

const notDirectRows = [
  ["verification_status", "매장 인증 상태는 참고 배지이며 TT Score에 직접 더하지 않습니다."],
  ["revisit_rate", "재방문 리뷰어 비율은 별도 참고 지표입니다."],
  ["trust_level badge", "신뢰도 배지는 설명용 표시이며 별도 가산점이 아닙니다."],
  ["ranking_score", "현재 UI 랭킹은 TT Score 기준으로 표시됩니다."],
  ["ranking_limited", "랭킹 노출 제한 또는 제외 제어에 사용될 수 있습니다."]
];

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

function FormulaCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {title}
      </div>
      <div className="mt-3 font-mono text-sm leading-7 text-zinc-900">{children}</div>
    </div>
  );
}

function MethodTable({
  rows,
  tone = "default"
}: {
  rows: string[][];
  tone?: "default" | "muted";
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      {rows.map(([label, description]) => (
        <div
          key={label}
          className="grid gap-2 border-b border-zinc-200 bg-white p-4 text-sm last:border-b-0 sm:grid-cols-[190px_1fr]"
        >
          <div className="font-mono text-xs font-semibold text-zinc-950">{label}</div>
          <div className={tone === "muted" ? "text-zinc-500" : "text-zinc-600"}>
            {description}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TtIndexPage() {
  let ttScores: number[] = [];
  let rawScores: number[] = [];
  let supabaseIssue: SupabaseIssueKind | null = null;
  let isSample = false;

  try {
    const stores = await getStores();
    ttScores = stores
      .map((store) => store.score?.adjusted_score)
      .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
    rawScores = stores
      .map((store) => store.score?.raw_score)
      .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  } catch (error) {
    supabaseIssue = isSupabaseSetupOrConnectionError(error)
      ? getSupabaseIssueKind(error)
      : "database";
  }

  if (!ttScores.length) {
    ttScores = representativeTtScores();
    rawScores = [4.45, 4.75, 4.18, 4.62, 4.31, 4.08];
    isSample = true;
  }

  const distribution = calculateScoreDistribution(ttScores);
  const averageTtScore = average(ttScores);
  const averageRawScore = average(rawScores);

  return (
    <div className="container py-8 sm:py-12">
      <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            TT Index Methodology
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            TT Score Methodology
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            TT Score는 일반 별점이 아니며, 매장 점수를 단순히 낮추기 위한 점수도 아닙니다.
            Trusttable은 먼저 리뷰 신뢰 신호를 반영한 RAW Score를 계산한 뒤, 현재 시장 평균 RAW
            Score를 TT Score 3.0으로 재정렬합니다.
          </p>
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-base font-semibold leading-7 text-zinc-950">
            TT Score 3.0 is not a low score. It is the market average line.
          </div>
        </div>
      </section>

      {supabaseIssue ? (
        <div className="mt-6">
          <DatabaseSetupNotice kind={supabaseIssue} />
        </div>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Average TT Score" value={formatScore(averageTtScore)} helper="시장 평균선 3.0 기준" />
        <MetricCard label="Average RAW Score" value={formatScore(averageRawScore)} helper="현재 데이터셋 RAW 평균" />
        <MetricCard
          label="Score Basis"
          value={isSample ? "Representative Sample" : "Current Dataset"}
          helper={isSample ? "데이터 연결 전 대표 샘플" : "현재 Trusttable 데이터 기준"}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>TT Score의 역할</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-600">
            <p>
              RAW Score는 그대로 보존되고 화면에 표시됩니다. TT Score는 RAW Score를 대체하는
              절대 평가가 아니라, 현재 시장 평균 대비 위치를 해석하는 보조 지표입니다.
            </p>
            <p>
              TT Score는 매장의 절대적 우열을 확정하는 점수가 아니라, 사용자가 매장을 선택할 때
              참고할 수 있는 리뷰 신뢰도 지표입니다.
            </p>
            <p>
              기존 별점은 대부분의 매장이 4점대에 몰리는 경향이 있어 차이가 잘 보이지 않습니다.
              Trusttable은 시장 평균을 3.0으로 재정렬해, 평균보다 어느 정도 높은지 또는 낮은지를
              더 명확하게 보여줍니다.
            </p>
            <p>
              리뷰 수, 리뷰 품질, 리뷰어 신뢰, 최근성, 구매 인증 신호가 바뀌면 RAW Score와 TT
              Score도 함께 달라질 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RAW Score vs TT Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                RAW Score
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                사용자가 남긴 리뷰 점수에 리뷰 품질과 리뷰어 신뢰도, 최근성, 구매 인증 가중치를
                반영한 신뢰 가중 원점수입니다.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                TT Score
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                현재 시장 평균 RAW Score를 3.0으로 맞춘 뒤, 각 매장이 평균보다 얼마나 높은지
                또는 낮은지를 보여주는 표시·랭킹 점수입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Calculation Flow
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          현재 TT Score 계산 흐름
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {calculationSteps.map((step) => (
            <div key={step.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-950">{step.title}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Review Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormulaCard title="Formula">
              Review Score =
              <br />
              taste_score x 0.50
              <br />
              + service_score x 0.25
              <br />+ environment_score x 0.25
            </FormulaCard>
            <p className="text-sm leading-6 text-zinc-600">
              현재 MVP의 기본 평가항목 비율은 맛 50%, 서비스 25%, 분위기 25%입니다. 랭킹
              화면에서는 사용자가 이 비율을 조정할 수 있으며, 합계는 100%로 정규화됩니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Weight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormulaCard title="Base Weight">
              Final Weight = Quality Weight x User Weight
            </FormulaCard>
            <p className="text-sm leading-6 text-zinc-600">
              모든 리뷰가 같은 영향력을 갖지는 않습니다. Quality Weight는 리뷰 길이, 사진,
              구체적인 고득점 사유 같은 품질 신호를 반영하고, User Weight / Trust Score는
              리뷰어의 프로필 통계를 반영합니다. 현재 화면 계산에서는 여기에 최근성 가중치와 구매
              인증 가중치도 리뷰별 영향력으로 반영됩니다.
            </p>
            <p className="text-sm font-medium leading-6 text-zinc-700">
              이 가중치들은 점수에 나중에 더하는 보너스가 아니라, 각 리뷰가 RAW Score에 얼마나
              강하게 기여하는지를 조정합니다.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>RAW Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormulaCard title="Formula">
              RAW Score =
              <br />
              sum(Review Score x Final Weight)
              <br />
              / sum(Final Weight)
            </FormulaCard>
            <p className="text-sm leading-6 text-zinc-600">
              RAW Score는 단순 평균이 아니라 신뢰 가중 원점수입니다. 리뷰 품질과 리뷰어 신뢰도는
              이 단계에서 이미 반영됩니다. 현재 랭킹 UI의 계산에서는 리뷰 작성 시점의 최근성과
              구매 인증 여부도 리뷰별 가중치로 함께 반영됩니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Average RAW Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormulaCard title="Dataset Baseline">
              Market Average RAW Score =
              <br />
              average RAW Score of stores in the current ranking dataset
            </FormulaCard>
            <p className="text-sm leading-6 text-zinc-600">
              기준선은 개별 리뷰 전체의 직접 평균이 아니라, 현재 랭킹 데이터셋에 포함된 매장별
              RAW Score의 평균입니다. 이 평균이 TT Score 3.0에 대응합니다.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          TT Score Formula
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          시장 평균 RAW Score를 3.0으로 재정렬합니다
        </h2>
        <FormulaCard title="Formula">
          TT Score =
          <br />
          clamp(RAW Score - Market Average RAW Score + 3.0, 1.0, 5.0)
        </FormulaCard>
        <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 sm:grid-cols-3">
          <div>
            <div className="font-semibold text-zinc-950">시장 평균 RAW Score</div>
            <div className="mt-1 font-mono tabular-nums">4.45</div>
          </div>
          <div>
            <div className="font-semibold text-zinc-950">A매장 RAW Score</div>
            <div className="mt-1 font-mono tabular-nums">4.75</div>
          </div>
          <div>
            <div className="font-semibold text-zinc-950">A매장 TT Score</div>
            <div className="mt-1 font-mono tabular-nums">4.75 - 4.45 + 3.0 = 3.30</div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          TT Score가 3.0을 넘으면 현재 시장 평균보다 높은 리뷰 신호를 가진 매장입니다. 3.0보다
          낮으면 현재 시장 평균보다 낮은 신호로 해석합니다. 표시 범위는 1.0에서 5.0 사이로
          제한됩니다.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>비교 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <MethodTable
              rows={[
                ["RAW Score", "신뢰 가중 원점수"],
                ["TT Score", "시장 평균선 3.0 기준의 표시·랭킹 점수"],
                ["Market Average RAW", "TT Score 3.0으로 매핑되는 현재 데이터셋 기준선"]
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>점수에 반영되는 것과 아닌 것</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">점수에 반영</h3>
              <div className="mt-3">
                <MethodTable rows={reflectedRows} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">TT Score에 직접 더하지 않음</h3>
              <div className="mt-3">
                <MethodTable rows={notDirectRows} tone="muted" />
              </div>
            </div>
            <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-700">
              원점수에는 리뷰 점수와 리뷰의 신뢰도가 반영됩니다. 인증 상태와 재방문 비율은 점수
              가산점이 아니라 참고 지표로 표시됩니다.
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6">
        <ScoreDistributionChart
          buckets={distribution}
          totalStores={ttScores.length}
          isSample={isSample}
        />
      </div>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Data Basis & Limitations
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          현재 데이터 기준의 해석 지표입니다
        </h2>
        <div className="mt-5 grid gap-3 text-sm leading-6 text-zinc-600 md:grid-cols-2">
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            TT Score는 현재 Trusttable 데이터셋을 기준으로 계산됩니다. 리뷰, 매장, 점수 설정,
            사용자 신뢰 가중치, 랭킹 포함 규칙이 바뀌면 점수도 달라질 수 있습니다.
          </p>
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            TT Score는 자동 가짜 리뷰 탐지를 직접 증명하지 않습니다. 신뢰 가중 리뷰 신호를 시장
            평균선 기준으로 다시 해석한 참고 지표입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
