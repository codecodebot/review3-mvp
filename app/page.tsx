import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { buttonVariants } from "@/components/ui/button";

type HomePageProps = {
  searchParams?: {
    auth?: string;
  };
};

const trustSignals = [
  "구매 인증 리뷰는 더 높게 반영",
  "구매 미인증 리뷰는 낮은 가중치 적용",
  "최근 리뷰 흐름 반영",
  "모든 매장은 TT Index 3.0 평균선 기준 정렬"
];

export default function HomePage({ searchParams }: HomePageProps) {
  const authRequired = searchParams?.auth === "required";

  return (
    <div className="tt-container tt-page">
      <section className="tt-hero">
        <div className="tt-hero__grid">
          <div className="tt-hero__copy">
            {authRequired ? (
              <div className="tt-alert">
                리뷰를 작성하려면 먼저 로그인해야 합니다.
              </div>
            ) : null}

            <div className="tt-hero__copy">
              <Image
                src="/brand/trusttable-logo.png"
                alt="Trusttable"
                width={180}
                height={180}
                priority
                className="tt-logo-large"
              />
              <p className="tt-kicker">
                Review Trust Infrastructure
              </p>
              <h1 className="tt-title">
                부풀려진 별점을 신뢰 가능한 지표로 다시 계산합니다.
              </h1>
              <p className="tt-lede">
                Trusttable은 RAW Score를 숨기지 않고, 구매 인증·최근 리뷰 흐름·리뷰어 신뢰 패턴을
                반영해 TT Index를 계산하는 리뷰 신뢰 분석 대시보드입니다.
              </p>
            </div>

            <div className="tt-actions">
              <Link href="/ranking" className={buttonVariants({ size: "lg" })}>
                랭킹 대시보드 보기 <ArrowRight className="tt-icon-sm" aria-hidden="true" />
              </Link>
              <Link href="/stores" className={buttonVariants({ variant: "outline", size: "lg" })}>
                매장 데이터 보기
              </Link>
            </div>
          </div>

          <div className="tt-hero__visual">
            <RawAdjustedScoreBlock
              score={{
                store_id: "demo",
                raw_score: 4.42,
                bayesian_raw_score: 3.91,
                adjusted_score: 3.34,
                ranking_score: 3.34,
                taste_score: 4.7,
                service_score: 4.1,
                environment_score: 4.2,
                review_count: 128,
                revisit_rate: 0.38,
                unique_reviewer_count: 88,
                returning_reviewer_count: 33,
                trust_level: "medium",
                peer_average_raw_score: 4.08,
                updated_at: new Date().toISOString()
              }}
            />
            <div className="tt-score-pair">
              <MetricCard label="RAW Score" value="4.42" helper="사용자 리뷰 원래 평균" />
              <MetricCard label="TT Index" value="3.34" helper="시장 평균선 3.0 기준" />
            </div>
          </div>
        </div>
      </section>

      <section className="tt-signal-grid">
        {trustSignals.map((signal) => (
          <div key={signal} className="tt-signal-card">
            {signal}
          </div>
        ))}
      </section>

      <section className="tt-info-grid">
        <article className="tt-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">RAW Score와 TT Index 동시 공개</h3>
          </div>
          <div className="tt-card-content">
            Trusttable은 RAW Score를 숨기지 않습니다. TT Index가 왜 달라졌는지 RAW Score와 함께
            비교할 수 있게 보여줍니다.
          </div>
        </article>
        <article className="tt-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">검증되지 않은 리뷰는 낮은 가중치</h3>
          </div>
          <div className="tt-card-content">
            구매 미인증 리뷰는 제외하지 않고 낮은 가중치로 반영합니다. 신뢰도 신호는 점수 설명과
            함께 투명하게 노출됩니다.
          </div>
        </article>
        <article className="tt-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">최근 상승 매장 감지</h3>
          </div>
          <div className="tt-card-content">
            최근 30일 리뷰가 과거 평균보다 충분히 높고 표본 수가 확보된 매장만 떠오르는 매장으로
            표시합니다.
          </div>
        </article>
      </section>
    </div>
  );
}
