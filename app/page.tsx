import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Search, SlidersHorizontal } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { buttonVariants } from "@/components/ui/button";

type HomePageProps = {
  searchParams?: {
    auth?: string;
  };
};

const analysisSteps = [
  { icon: Search, number: "01", title: "매장 찾기", body: "식당 링크나 매장명을 입력합니다." },
  { icon: ClipboardCheck, number: "02", title: "리뷰 근거 확인", body: "최신성, 인증 여부, 반복 패턴을 정리합니다." },
  { icon: SlidersHorizontal, number: "03", title: "TT Index 비교", body: "시장 평균 3.0 기준으로 경쟁력을 해석합니다." }
];

export default function HomePage({ searchParams }: HomePageProps) {
  const authRequired = searchParams?.auth === "required";

  return (
    <div className="tt-container tt-page">
      <section className="tt-home-hero">
        <div className="tt-hero__grid">
          <div className="tt-hero__copy">
            {authRequired ? (
              <div className="tt-alert">
                리뷰를 작성하려면 먼저 로그인해야 합니다.
              </div>
            ) : null}

            <div className="tt-home-hero__heading">
              <BrandMark />
              <p className="tt-kicker">Independent review analysis</p>
              <h1 className="tt-title">
                별점은 높지만,<br />정말 믿을 만할까요?
              </h1>
              <p className="tt-lede">
                식당 링크를 붙여 넣으면 리뷰의 최신성, 인증 여부, 반복 패턴을 분석해 실제 경쟁력을
                보여드립니다.
              </p>
            </div>
            <form action="/stores" className="tt-analysis-form" role="search">
              <label htmlFor="home-query" className="tt-sr-only">식당 링크 또는 매장명</label>
              <Search className="tt-analysis-form__icon" aria-hidden="true" />
              <input
                id="home-query"
                name="q"
                type="search"
                className="tt-analysis-form__input"
                placeholder="식당 링크 또는 매장명을 입력하세요"
              />
              <button type="submit" className="tt-button tt-button--primary tt-button--lg">
                신뢰도 분석하기 <ArrowRight className="tt-icon-sm" aria-hidden="true" />
              </button>
            </form>
            <div className="tt-home-hero__secondary">
              <Link href="/ranking" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                예시 결과 보기 <ArrowRight className="tt-icon-sm" aria-hidden="true" />
              </Link>
              <span>등록 매장은 매장명으로도 찾을 수 있어요.</span>
            </div>
          </div>

          <div className="tt-home-preview" aria-label="TrustTable 분석 결과 예시">
            <div className="tt-home-preview__header">
              <div>
                <p className="tt-kicker">Analysis preview</p>
                <h2>Maple Dessert 041</h2>
                <p>서울 마포 · 디저트 · 리뷰 128개</p>
              </div>
              <span className="tt-status-label tt-status-label--positive">
                <CheckCircle2 aria-hidden="true" /> 근거 충분
              </span>
            </div>
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
            <p className="tt-home-preview__verdict">시장 평균보다 높은 리뷰 신호가 안정적으로 확인됩니다.</p>
          </div>
        </div>
      </section>

      <section className="tt-home-steps" aria-labelledby="analysis-steps-title">
        <div className="tt-section-heading">
          <p className="tt-kicker">How it works</p>
          <h2 id="analysis-steps-title" className="tt-section-title">세 단계로 리뷰 신호를 확인합니다</h2>
        </div>
        <div className="tt-home-steps__grid">
          {analysisSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article key={step.number} className="tt-process-step">
                <div className="tt-process-step__top">
                  <Icon aria-hidden="true" />
                  <span>{step.number}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="tt-transparency-band">
        <div>
          <p className="tt-kicker">Transparent by design</p>
          <h2 className="tt-section-title">점수가 달라진 이유를 숨기지 않습니다</h2>
        </div>
        <div className="tt-transparency-list">
          {[
            "구매 인증 리뷰는 더 높게 반영",
            "구매 미인증 리뷰는 낮은 가중치 적용",
            "최근 리뷰 흐름 반영",
            "시장 평균 3.0 기준으로 비교"
          ].map((signal) => (
            <div key={signal}><CheckCircle2 aria-hidden="true" /> {signal}</div>
          ))}
        </div>
      </section>

      <section className="tt-home-links">
        {[
          ["매장 탐색", "지역과 카테고리별로 신뢰 지표를 비교합니다.", "/stores"],
          ["전체 랭킹", "TT Index와 RAW Score를 같은 화면에서 봅니다.", "/ranking"],
          ["계산 방법", "평균선과 가중치가 적용되는 방식을 확인합니다.", "/tt-index"]
        ].map(([title, body, href]) => (
          <Link key={href} href={href} className="tt-home-link">
            <div><h3>{title}</h3><p>{body}</p></div>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </section>
    </div>
  );
}
