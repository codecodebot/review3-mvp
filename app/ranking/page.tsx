import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { RankingTable } from "@/components/ranking-table";
import { getRankedStores } from "@/lib/queries";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { StoreWithScoreAndReviews } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  let stores: StoreWithScoreAndReviews[] = [];
  let supabaseIssue: SupabaseIssueKind | null = null;

  try {
    stores = await getRankedStores();
  } catch (error) {
    if (!isSupabaseSetupOrConnectionError(error)) {
      throw error;
    }

    supabaseIssue = getSupabaseIssueKind(error);
  }

  return (
    <div className="tt-container tt-page">
      <section className="tt-page-hero">
        <div className="tt-page-hero__content">
          <p className="tt-kicker">
            Trusttable Ranking Console
          </p>
          <h1 className="tt-page-title">
            부풀려진 별점을 TT Index로 다시 해석해 신뢰 가능한 매장 순위를 보여줍니다.
          </h1>
          <p className="tt-lede">
            RAW Score, TT Index, 구매 인증 가중치, 최근 리뷰 상승 신호를 한 화면에서 비교합니다.
            점수는 숨기지 않고 왜 바뀌었는지 함께 설명합니다.
          </p>
        </div>
      </section>
      {supabaseIssue ? <DatabaseSetupNotice kind={supabaseIssue} /> : <RankingTable stores={stores} />}
    </div>
  );
}
