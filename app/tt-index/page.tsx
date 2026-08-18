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
    <ul className="tt-simple-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
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
      .filter((store) => (store.score?.review_count ?? 0) >= 5)
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
    <div className="tt-container tt-page">
      <section className="tt-page-hero">
        <div className="tt-page-hero__content">
          <p className="tt-kicker">
            TT Index Methodology
          </p>
          <h1 className="tt-page-title">
            TT Index는 일반 별점이 아닙니다
          </h1>
          <p className="tt-lede">
            RAW Score는 사용자가 남긴 원래 리뷰 점수입니다. TT Index는 RAW Score를 시장 평균
            3.0 기준으로 다시 해석해, 평균보다 얼마나 높은지 또는 낮은지를 보여주는 참고 지표입니다.
          </p>
          <div className="tt-callout">
            3.0은 낮은 점수가 아니라, Trusttable의 시장 평균선입니다.
          </div>
        </div>
      </section>

      {supabaseIssue ? (
        <div style={{ marginTop: 24 }}>
          <DatabaseSetupNotice kind={supabaseIssue} />
        </div>
      ) : null}

      <section className="tt-summary-grid">
        <MetricCard label="Average TT Index" value="3.00" helper="시장 평균선" />
        <MetricCard
          label="Average RAW Score"
          value={formatScore(averageRawScore)}
          helper="신뢰 가중 원점수 평균"
        />
        <MetricCard
          label="Stores Analyzed"
          value={distributionSummary.storeCount.toLocaleString()}
          helper="리뷰 5개 이상 매장"
        />
      </section>

      <section className="tt-page-hero" style={{ marginTop: 24 }}>
        <p className="tt-kicker">
          What TT Index Means
        </p>
        <h2 className="tt-section-title" style={{ marginTop: 10 }}>
          RAW Score를 시장 평균선 위에서 다시 읽습니다
        </h2>
        <p className="tt-lede">
          Trusttable은 매장의 별점을 깎기 위한 서비스가 아닙니다. 기존 RAW Score는 그대로 보여주고,
          TT Index는 시장 평균 대비 위치를 해석하는 보조 지표입니다.
        </p>
        <div className="tt-method-grid">
          <div className="tt-method-chip">
            <div className="tt-method-chip__title">RAW Score</div>
            <p>
              사용자가 남긴 원래 리뷰 점수의 신뢰 가중 평균입니다.
            </p>
          </div>
          <div className="tt-method-chip">
            <div className="tt-method-chip__title">시장 평균</div>
            <p>
              현재 비교 대상 매장들의 RAW Score 평균입니다.
            </p>
          </div>
          <div className="tt-method-chip">
            <div className="tt-method-chip__title">TT Index</div>
            <p>
              시장 평균을 3.0으로 맞춘 뒤 각 매장의 상대 위치를 보여줍니다.
            </p>
          </div>
        </div>
      </section>

      <section className="tt-info-grid tt-info-grid--two">
        <Card>
          <CardHeader>
            <CardTitle>계산 공식</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tt-formula">
              TT Index = RAW Score - Market Average RAW Score + 3.0
            </div>
            <p className="tt-card-description" style={{ marginTop: 14 }}>
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

      <div style={{ marginTop: 24 }}>
        <ScoreDistributionChart summary={distributionSummary} />
      </div>
    </div>
  );
}
