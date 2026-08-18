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
    <div className="tt-container tt-page tt-page--wide">
      <section className="tt-page-hero">
        <div className="tt-page-hero__content">
          <div className="tt-detail-header">
            <div>
              <p className="tt-kicker">
                Store Intelligence
              </p>
              <h1 className="tt-page-title">
                매장별 신뢰 점수 현황
              </h1>
              <p className="tt-lede">
                매장명과 주소를 검색하고, 지역과 카테고리별로 RAW Score, TT Score, 인증 상태를 한 화면에서 비교합니다.
              </p>
            </div>
            <Link
              href="/admin/stores/new"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              실제 매장 등록
            </Link>
          </div>

          <form
            className="tt-filter-panel"
            action="/stores"
          >
            <div className="tt-filter-grid">
              <div className="tt-field">
                <Label htmlFor="q">매장 검색</Label>
                <Input
                  id="q"
                  name="q"
                  type="search"
                  placeholder="매장명 또는 주소"
                  defaultValue={query}
                />
              </div>
              <div className="tt-field">
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
              <div className="tt-field">
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
              <Button type="submit">검색</Button>
            </div>
          </form>

          <div className="tt-summary-grid">
            <div className="tt-summary-box">
              <p className="tt-summary-box__label">지도 표시</p>
              <p className="tt-summary-box__value">
                {mapStores.length.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="tt-summary-box">
              <p className="tt-summary-box__label">목록 표시</p>
              <p className="tt-summary-box__value">
                {stores.length.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="tt-summary-box">
              <p className="tt-summary-box__label">현재 조건</p>
              <p className="tt-summary-box__note">
                {regionLabel} · {categoryLabel}
              </p>
              {query ? <p className="tt-summary-box__note">검색어: {query}</p> : null}
            </div>
          </div>
        </div>
      </section>

      {supabaseIssue ? (
        <DatabaseSetupNotice kind={supabaseIssue} />
      ) : stores.length || mapStores.length ? (
        <>
          <div className="tt-map-block">
            <StoreMapExplorer stores={mapStores} />
          </div>
          <div className="tt-toolbar-note">
            <span className="tt-toolbar-note__copy">
              지도에는 현재 검색 조건의 좌표 등록 매장을 모두 표시하고, 목록은 성능을 위해 최대{" "}
              {STORE_LIST_LIMIT}개만 먼저 보여줍니다.
            </span>
            <span className="tt-badge tt-badge--muted">
              {regionLabel} · {categoryLabel}
            </span>
          </div>
          {stores.length ? (
            <div className="tt-store-grid">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="tt-empty-state">
              현재 조건에서 목록에 표시할 매장이 없습니다.
            </div>
          )}
        </>
      ) : (
        <div className="tt-empty-state">
          선택한 조건에 맞는 매장이 없습니다.
        </div>
      )}
    </div>
  );
}
