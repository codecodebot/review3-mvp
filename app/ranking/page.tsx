import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { RankingTable } from "@/components/ranking-table";
import { getRankedStores } from "@/lib/queries";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { StoreWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  let stores: StoreWithScore[] = [];
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
    <div className="container py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">랭킹</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          표시 가능한 리뷰가 5개 이상인 매장만 보입니다. 랭킹은 평균 중심 보정 점수로 정렬하며,
          신뢰도, 인증 상태, 재방문 리뷰어 비율은 참고 지표로 표시합니다.
        </p>
      </div>
      {supabaseIssue ? <DatabaseSetupNotice kind={supabaseIssue} /> : <RankingTable stores={stores} />}
    </div>
  );
}
