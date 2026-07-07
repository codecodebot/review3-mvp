import { createClient } from "@/lib/supabase/server";
import type {
  ReportWithReporter,
  Review,
  ReviewWithProfile,
  Store,
  StoreScoreCache,
  StoreWithScore
} from "@/lib/types";

export type StoreFilters = {
  region?: string;
  category?: string;
};

export type AdminReview = ReviewWithProfile & {
  store: Pick<Store, "id" | "name"> | null;
};

function hasFilter(value: string | undefined): value is string {
  return Boolean(value && value !== "all");
}

function mergeStoresWithScores(stores: Store[], scores: StoreScoreCache[]) {
  const scoreByStore = new Map(scores.map((score) => [score.store_id, score]));
  return stores.map<StoreWithScore>((store) => ({
    ...store,
    score: scoreByStore.get(store.id) ?? null
  }));
}

export async function getStores(filters: StoreFilters = {}) {
  const supabase = createClient();
  let query = supabase.from("stores").select("*").order("name", { ascending: true });

  if (hasFilter(filters.region)) {
    query = query.eq("region", filters.region);
  }

  if (hasFilter(filters.category)) {
    query = query.eq("category", filters.category);
  }

  const { data: stores, error } = await query.returns<Store[]>();

  if (error) {
    throw new Error(`Unable to load stores: ${error.message}`);
  }

  if (!stores.length) {
    return [];
  }

  const { data: scores, error: scoreError } = await supabase
    .from("store_score_cache")
    .select("*")
    .in(
      "store_id",
      stores.map((store) => store.id)
    )
    .returns<StoreScoreCache[]>();

  if (scoreError) {
    throw new Error(`Unable to load store scores: ${scoreError.message}`);
  }

  return mergeStoresWithScores(stores, scores ?? []);
}

export async function getStore(storeId: string) {
  const supabase = createClient();
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle<Store>();

  if (error) {
    throw new Error(`Unable to load store: ${error.message}`);
  }

  if (!store) {
    return null;
  }

  const { data: score, error: scoreError } = await supabase
    .from("store_score_cache")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle<StoreScoreCache>();

  if (scoreError) {
    throw new Error(`Unable to load store score: ${scoreError.message}`);
  }

  return {
    ...store,
    score: score ?? null
  } satisfies StoreWithScore;
}

export async function getReviewsForStore(storeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profile:profiles!reviews_user_id_fkey(id,nickname,trust_score,review_count)")
    .eq("store_id", storeId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .returns<ReviewWithProfile[]>();

  if (error) {
    throw new Error(`Unable to load reviews: ${error.message}`);
  }

  return data ?? [];
}

export async function getRankedStores() {
  const supabase = createClient();
  const { data: scores, error } = await supabase
    .from("store_score_cache")
    .select("*")
    .gte("review_count", 5)
    .order("raw_score", { ascending: false })
    .returns<StoreScoreCache[]>();

  if (error) {
    throw new Error(`Unable to load ranking: ${error.message}`);
  }

  if (!scores?.length) {
    return [];
  }

  const ids = scores.map((score) => score.store_id);
  const { data: stores, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .in("id", ids)
    .eq("ranking_limited", false)
    .returns<Store[]>();

  if (storeError) {
    throw new Error(`Unable to load ranked stores: ${storeError.message}`);
  }

  const storeById = new Map((stores ?? []).map((store) => [store.id, store]));
  return scores
    .flatMap<StoreWithScore>((score) => {
      const store = storeById.get(score.store_id);
      return store ? [{ ...store, score }] : [];
    })
    .sort((a, b) => {
      const aRaw = a.score?.raw_score ?? 0;
      const bRaw = b.score?.raw_score ?? 0;
      return bRaw - aRaw;
    });
}

export async function getReports() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(id,nickname,trust_score,review_count)")
    .order("created_at", { ascending: false })
    .returns<ReportWithReporter[]>();

  if (error) {
    throw new Error(`Unable to load reports: ${error.message}`);
  }

  return data ?? [];
}

export async function getRecentReviewsForAdmin() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "*, profile:profiles!reviews_user_id_fkey(id,nickname,trust_score,review_count), store:stores!reviews_store_id_fkey(id,name)"
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<AdminReview[]>();

  if (error) {
    throw new Error(`Unable to load admin reviews: ${error.message}`);
  }

  return data ?? [];
}

export async function getAdminStores() {
  return getStores();
}

export async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
