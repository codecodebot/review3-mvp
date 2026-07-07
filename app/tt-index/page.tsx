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

const meaningCards = [
  {
    title: "RAW Score",
    body: "리뷰 품질과 리뷰어 신뢰도를 반영한 신뢰 가중 원점수"
  },
  {
    title: "Market Average",
    body: "현재 매장들의 평균 리뷰 신호"
  },
  {
    title: "TT Score",
    body: "시장 평균을 3.0으로 맞춰 다시 해석한 점수"
  }
];

const scoreFlow = [
  {
    title: "리뷰 세부 평가",
    items: ["맛 평가", "서비스 평가", "분위기 평가"]
  },
  {
    title: "리뷰 품질",
    items: ["리뷰 내용의 충분함", "사진 여부", "구체적인 평가 사유"]
  },
  {
    title: "리뷰어 신뢰도",
    items: ["리뷰 작성 이력", "평점 패턴", "신고 또는 숨김 이력 등 신뢰 신호"]
  },
  {
    title: "RAW Score",
    items: ["리뷰별 영향력을 반영한 신뢰 가중 원점수"]
  },
  {
    title: "TT Score",
    items: ["시장 평균 3.0 기준으로 다시 정렬한 최종 점수"]
  }
];

const reflectedItems = [
  "맛·서비스·분위기 평가",
  "리뷰 품질",
  "리뷰어 신뢰도"
];

const referenceItems = ["인증 상태", "재방문 비율", "신뢰도 배지"];

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
            TT Score Methodology
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            TT Score는 Trusttable의 시장 평균 기준 점수입니다. RAW Score는 리뷰 품질과 리뷰어
            신뢰도를 반영한 원점수이고, TT Score는 그 점수를 시장 평균 3.0 기준으로 다시 정렬한
            지표입니다.
          </p>
          <div className="mt-6 inline-flex rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-base font-semibold text-zinc-950">
            TT Score 3.0 = 시장 평균선
          </div>
        </div>
      </section>

      {supabaseIssue ? (
        <div className="mt-6">
          <DatabaseSetupNotice kind={supabaseIssue} />
        </div>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Average TT Score" value="3.00" helper="시장 평균선" />
        <MetricCard
          label="Average RAW Score"
          value={formatScore(averageRawScore)}
          helper="신뢰 가중 원점수 평균"
        />
        <MetricCard
          label="Score Basis"
          value="Current Dataset"
          helper="현재 Trusttable 데이터 기준"
        />
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          What TT Score Means
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          RAW Score를 시장 평균선 위에서 다시 읽습니다
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {meaningCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-950">{card.title}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{card.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-sm font-medium leading-6 text-zinc-700">
          3.0보다 높으면 평균보다 강한 리뷰 신호, 3.0보다 낮으면 평균보다 약한 리뷰 신호로
          해석합니다. TT Score는 매장의 절대적 우열을 확정하는 점수가 아니라 선택을 돕는 참고
          지표입니다.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Score Inputs
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          점수 계산에서 고려하는 흐름
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {scoreFlow.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-zinc-950">{step.title}</h3>
              </div>
              <div className="mt-4">
                <SimpleList items={step.items} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>계산에 반영되는 항목</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleList items={reflectedItems} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>참고 지표로 표시</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleList items={referenceItems} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-sm font-medium leading-7 text-zinc-700">
          원점수에는 리뷰 품질과 리뷰어 신뢰도가 반영됩니다. 인증 상태와 재방문 비율은 점수
          가산점이 아니라 참고 지표로 표시됩니다.
        </p>
      </section>

      <div className="mt-6">
        <ScoreDistributionChart summary={distributionSummary} />
      </div>

      <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Technical Summary
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          기술 계산 요약
        </h2>
        <div className="mt-5 grid gap-3 text-sm leading-6 text-zinc-600 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            RAW Score는 리뷰 평가에 리뷰 품질과 리뷰어 신뢰도를 반영해 계산합니다.
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-zinc-900">
            TT Score = clamp(RAW Score - Market Average RAW + 3.0, 1.0, 5.0)
          </div>
        </div>
      </section>
    </div>
  );
}
