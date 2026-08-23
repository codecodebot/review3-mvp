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
          <p className="tt-kicker">Market ranking report</p>
          <h1 className="tt-page-title">
            신뢰 근거로 다시 읽는 매장 랭킹
          </h1>
          <p className="tt-lede">
            TT Index를 중심으로 원래 별점, 구매 인증, 최근 리뷰 흐름을 함께 비교합니다. 순위보다
            중요한 것은 점수가 달라진 이유입니다.
          </p>
        </div>
      </section>
      {supabaseIssue ? <DatabaseSetupNotice kind={supabaseIssue} /> : <RankingTable stores={stores} />}
    </div>
  );
}
