import Link from "next/link";
import { RawAdjustedScoreBlock } from "@/components/raw-adjusted-score-block";
import { RevisitRateDetail } from "@/components/revisit-rate";
import { RisingStoreBadge } from "@/components/rising-store-badge";
import { ScoreDelta } from "@/components/score-delta";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import type { StoreWithScore } from "@/lib/types";

type StoreCardProps = {
  store: StoreWithScore;
};

export function StoreCard({ store }: StoreCardProps) {
  const rawScore = store.score?.raw_score ?? 0;
  const adjustedScore = store.score?.adjusted_score ?? 0;
  const hasCoordinates = typeof store.lat === "number" && typeof store.lng === "number";

  return (
    <Card
      id={`store-${store.id}`}
      className="tt-store-card"
    >
      <div className="tt-store-card__header">
        <div>
          <div className="tt-store-card__eyebrow">
            <span className="tt-badge tt-badge--muted">
              매장 프로필
            </span>
            {hasCoordinates ? (
              <span className="tt-badge tt-badge--success">
                지도 표시
              </span>
            ) : null}
          </div>
          <div className="tt-store-card__title-row">
            <h3 className="tt-store-title">{store.name}</h3>
            <RisingStoreBadge rising={store.rising} compact />
          </div>
          {store.rising?.isRising ? (
            <p className="tt-store-meta">
              최근 유효 리뷰가 과거 평균보다 높습니다.
            </p>
          ) : null}
          <p className="tt-store-meta">
            {formatRegionLabel(store.region)} · {formatCategoryLabel(store.category)}
          </p>
          {store.address ? (
            <p className="tt-store-address">{store.address}</p>
          ) : null}
        </div>
        <div className="tt-chip-row">
          <VerificationBadge status={store.verification_status} />
          <TrustBadge level={store.score?.trust_level} />
        </div>
      </div>
      <div className="tt-store-card__content">
        <div className="tt-score-panel">
          <RawAdjustedScoreBlock score={store.score} compact />
          <div style={{ marginTop: 12 }}>
            <ScoreDelta adjustedScore={adjustedScore} rawScore={rawScore} />
          </div>
        </div>
        <div className="tt-card-stat-grid">
          <div className="tt-card-stat">
            <div className="tt-card-stat__label">리뷰 수</div>
            <div className="tt-card-stat__value">
              {store.score?.review_count ?? 0}
            </div>
          </div>
          <div className="tt-card-stat">
            <div className="tt-card-stat__label">
              재방문
            </div>
            <RevisitRateDetail score={store.score} />
          </div>
        </div>
        <div className="tt-link-grid">
          <Link
            href={`/stores/${store.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            상세 보기
          </Link>
          <Link
            href={`/stores/${store.id}#location-map`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            지도 보기
          </Link>
        </div>
      </div>
    </Card>
  );
}
