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
    <div className="container py-8 sm:py-12">
      <div className="mb-8 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Trusttable Ranking Console
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            inflated ratings를 TT Score로 다시 해석해 신뢰 가능한 매장 순위를 보여줍니다.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            RAW Score, TT Score, 구매 인증 가중치, 최근 리뷰 상승 신호를 한 화면에서 비교합니다.
            점수는 숨기지 않고 왜 바뀌었는지 함께 설명합니다.
          </p>
        </div>
      </div>
      {supabaseIssue ? <DatabaseSetupNotice kind={supabaseIssue} /> : <RankingTable stores={stores} />}
    </div>
  );
}
