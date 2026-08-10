import Link from "next/link";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { StoreCard } from "@/components/store-card";
import { StoreMapExplorer } from "@/components/store-map-explorer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  STORE_CATEGORIES,
  STORE_REGIONS,
  formatCategoryLabel,
  formatRegionLabel
} from "@/lib/constants";
import { getStoreMapPoints, getStores } from "@/lib/queries";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { StoreMapPoint, StoreWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

const STORE_LIST_LIMIT = 120;

type StoresPageProps = {
  searchParams?: {
    region?: string;
    category?: string;
    q?: string;
  };
};

export default async function StoresPage({ searchParams }: StoresPageProps) {
  let stores: StoreWithScore[] = [];
  let mapStores: StoreMapPoint[] = [];
  let supabaseIssue: SupabaseIssueKind | null = null;
  const query = searchParams?.q?.trim() ?? "";

  try {
    [stores, mapStores] = await Promise.all([
      getStores({
        region: searchParams?.region,
        category: searchParams?.category,
        query,
        limit: STORE_LIST_LIMIT
      }),
      getStoreMapPoints({
        region: searchParams?.region,
        category: searchParams?.category,
        query
      })
    ]);
  } catch (error) {
    if (!isSupabaseSetupOrConnectionError(error)) {
      throw error;
    }

    supabaseIssue = getSupabaseIssueKind(error);
  }

  return (
    <div className="container py-8 sm:py-10">
      <div className="mb-8 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Store Intelligence
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                매장별 신뢰 점수 현황
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                매장명과 주소를 검색하고, 지역과 카테고리별로 RAW Score, TT Score, 인증 상태를 비교합니다.
              </p>
            </div>
            <Link href="/admin/stores/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              실제 매장 등록
            </Link>
          </div>

          <form className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_160px_auto]" action="/stores">
            <div className="space-y-2">
              <Label htmlFor="q">매장 검색</Label>
              <Input
                id="q"
                name="q"
                type="search"
                placeholder="매장명 또는 주소"
                defaultValue={query}
                className="bg-white"
              />
            </div>
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
            <Button type="submit" className="self-end">
              검색
            </Button>
          </form>
        </div>
      </div>

      {supabaseIssue ? (
        <DatabaseSetupNotice kind={supabaseIssue} />
      ) : stores.length || mapStores.length ? (
        <>
          <div className="mb-6">
            <StoreMapExplorer stores={mapStores} />
          </div>
          <div className="mb-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            지도에는 현재 검색 조건의 좌표 등록 매장을 모두 표시하고, 아래 목록은 성능을 위해 최대{" "}
            {STORE_LIST_LIMIT}개만 먼저 보여줍니다.
          </div>
          {stores.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
              현재 조건에서 목록에 표시할 매장이 없습니다.
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          선택한 조건에 맞는 매장이 없습니다.
        </div>
      )}
    </div>
  );
}
