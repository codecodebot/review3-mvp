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
  const regionLabel =
    searchParams?.region && searchParams.region !== "all"
      ? formatRegionLabel(searchParams.region)
      : "전체 지역";
  const categoryLabel =
    searchParams?.category && searchParams.category !== "all"
      ? formatCategoryLabel(searchParams.category)
      : "전체 카테고리";

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
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.055)]">
        <div className="h-1 bg-zinc-950" />
        <div className="p-6 sm:p-8">
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
                매장명과 주소를 검색하고, 지역과 카테고리별로 RAW Score, TT Score, 인증 상태를 한 화면에서 비교합니다.
              </p>
            </div>
            <Link
              href="/admin/stores/new"
              className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
            >
              실제 매장 등록
            </Link>
          </div>

          <form
            className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 sm:p-4 lg:grid-cols-[minmax(280px,1fr)_170px_170px_auto]"
            action="/stores"
          >
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-zinc-500">지도 표시</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">
                {mapStores.length.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-zinc-500">목록 표시</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">
                {stores.length.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-zinc-500">현재 조건</p>
              <p className="mt-2 line-clamp-1 text-sm font-semibold text-zinc-950">
                {regionLabel} · {categoryLabel}
              </p>
              {query ? <p className="mt-1 line-clamp-1 text-xs text-zinc-500">검색어: {query}</p> : null}
            </div>
          </div>
        </div>
        </div>
      </div>

      {supabaseIssue ? (
        <DatabaseSetupNotice kind={supabaseIssue} />
      ) : stores.length || mapStores.length ? (
        <>
          <div className="mb-6">
            <StoreMapExplorer stores={mapStores} />
          </div>
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-[0_1px_2px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between">
            <span>
              지도에는 현재 검색 조건의 좌표 등록 매장을 모두 표시하고, 목록은 성능을 위해 최대{" "}
              {STORE_LIST_LIMIT}개만 먼저 보여줍니다.
            </span>
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
              {regionLabel} · {categoryLabel}
            </span>
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
