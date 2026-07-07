import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { StoreCard } from "@/components/store-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  STORE_CATEGORIES,
  STORE_REGIONS,
  formatCategoryLabel,
  formatRegionLabel
} from "@/lib/constants";
import { getStores } from "@/lib/queries";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { StoreWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

type StoresPageProps = {
  searchParams?: {
    region?: string;
    category?: string;
  };
};

export default async function StoresPage({ searchParams }: StoresPageProps) {
  let stores: StoreWithScore[] = [];
  let supabaseIssue: SupabaseIssueKind | null = null;

  try {
    stores = await getStores({
      region: searchParams?.region,
      category: searchParams?.category
    });
  } catch (error) {
    if (!isSupabaseSetupOrConnectionError(error)) {
      throw error;
    }

    supabaseIssue = getSupabaseIssueKind(error);
  }

  return (
    <div className="container py-8 sm:py-10">
      <div className="mb-8 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Store Intelligence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            매장별 신뢰 점수 현황
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            지역과 카테고리별로 RAW Score, TT Score, 인증 상태, 최근 상승 신호를 비교합니다.
          </p>
        </div>
        <form className="grid gap-3 sm:grid-cols-[160px_160px_auto]" action="/stores">
          <div className="space-y-2">
            <Label htmlFor="region">지역</Label>
            <Select id="region" name="region" defaultValue={searchParams?.region ?? "all"}>
              <option value="all">전체 지역</option>
              {STORE_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {formatRegionLabel(region)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select id="category" name="category" defaultValue={searchParams?.category ?? "all"}>
              <option value="all">전체 카테고리</option>
              {STORE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatCategoryLabel(category)}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">적용</Button>
        </form>
        </div>
      </div>

      {supabaseIssue ? (
        <DatabaseSetupNotice kind={supabaseIssue} />
      ) : stores.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          선택한 조건에 맞는 매장이 없습니다.
        </div>
      )}
    </div>
  );
}
