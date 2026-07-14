import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/setup";
import {
  DEFAULT_RECENCY_OPTIONS,
  DEFAULT_SCORE_WEIGHTS,
  calculateAdjustedScore,
  calculateRawAverage,
  calculateRecencyWeightedRawScore,
  calculateRisingStoreSignal
} from "@/lib/scoring";
import type {
  ReportWithReporter,
  Review,
  ReviewWithProfile,
  RankingReview,
  Store,
  StoreScoreCache,
  StoreWithScore,
  StoreWithScoreAndReviews
} from "@/lib/types";

export type StoreFilters = {
  region?: string;
  category?: string;
};

export type AdminReview = ReviewWithProfile & {
  store: Pick<Store, "id" | "name"> | null;
};

type RankingReviewWithoutSectionWeight = Omit<RankingReview, "text_completeness_weight">;

const RANKING_REVIEW_SELECT =
  "store_id,taste_score,service_score,environment_score,created_at,purchase_verified,text_completeness_weight";

const LEGACY_RANKING_REVIEW_SELECT =
  "store_id,taste_score,service_score,environment_score,created_at,purchase_verified";

function hasFilter(value: string | undefined): value is string {
  return Boolean(value && value !== "all");
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function throwLoggedSupabaseError(scope: string, message: string, error: unknown): never {
  logSupabaseError(scope, error);
  throw new Error(message);
}

function buildRisingSignal(reviews: RankingReview[]) {
  const signal = calculateRisingStoreSignal(reviews, DEFAULT_SCORE_WEIGHTS, {
    halfLifeDays: DEFAULT_RECENCY_OPTIONS.halfLifeDays,
    minRecencyWeight: DEFAULT_RECENCY_OPTIONS.minRecencyWeight
  });

  return {
    isRising: signal.isRising,
    risingDelta: roundTwo(signal.risingDelta),
    recentReviewCount: signal.recentReviewCount
  };
}

function groupReviewsByStore(reviews: RankingReview[]) {
  const reviewsByStoreId = new Map<string, RankingReview[]>();

  for (const review of reviews) {
    const storeReviews = reviewsByStoreId.get(review.store_id) ?? [];
    storeReviews.push(review);
    reviewsByStoreId.set(review.store_id, storeReviews);
  }

  return reviewsByStoreId;
}

async function getScoringReviewsForStores(storeIds: string[]) {
  if (!storeIds.length) {
    return new Map<string, RankingReview[]>();
  }

  const supabase = createClient();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(RANKING_REVIEW_SELECT)
    .in("store_id", storeIds)
    .eq("is_hidden", false)
    .eq("excluded_from_score", false)
    .returns<RankingReview[]>();

  if (error) {
    if (/text_completeness_weight|positive_text|negative_text/i.test(error.message)) {
      const { data: legacyReviews, error: legacyError } = await supabase
        .from("reviews")
        .select(LEGACY_RANKING_REVIEW_SELECT)
        .in("store_id", storeIds)
        .eq("is_hidden", false)
        .eq("excluded_from_score", false)
        .returns<RankingReviewWithoutSectionWeight[]>();

      if (legacyError) {
        throwLoggedSupabaseError(
          "scoring-reviews.legacy",
          `Unable to load scoring reviews: ${legacyError.message}`,
          legacyError
        );
      }

      return groupReviewsByStore(
        (legacyReviews ?? []).map((review) => ({
          ...review,
          text_completeness_weight: 1
        }))
      );
    }

    throwLoggedSupabaseError("scoring-reviews", `Unable to load scoring reviews: ${error.message}`, error);
  }

  return groupReviewsByStore(reviews ?? []);
}

function mergeStoresWithScores(
  stores: Store[],
  scores: StoreScoreCache[],
  reviewsByStoreId: Map<string, RankingReview[]> = new Map()
) {
  const scoreByStore = new Map(scores.map((score) => [score.store_id, score]));
  return stores.map<StoreWithScore>((store) => ({
    ...store,
    score: scoreByStore.get(store.id) ?? null,
    rising: buildRisingSignal(reviewsByStoreId.get(store.id) ?? [])
  }));
}

async function computeDefaultScoreOverlay(
  storeId: string,
  score: StoreScoreCache | null,
  targetReviews: RankingReview[]
) {
  if (!score || !targetReviews.length) {
    return score;
  }

  const supabase = createClient();
  const { data: rankingScores, error: scoreError } = await supabase
    .from("store_score_cache")
    .select("store_id,review_count")
    .gte("review_count", 5)
    .returns<Array<Pick<StoreScoreCache, "store_id" | "review_count">>>();

  if (scoreError) {
    throwLoggedSupabaseError(
      "score-normalization-peers",
      `Unable to load score normalization peers: ${scoreError.message}`,
      scoreError
    );
  }

  const peerStoreIds = Array.from(
    new Set([storeId, ...(rankingScores ?? []).map((rankingScore) => rankingScore.store_id)])
  );
  const reviewsByStoreId = await getScoringReviewsForStores(peerStoreIds);
  const rawScores = peerStoreIds
    .map((peerStoreId) =>
      calculateRecencyWeightedRawScore(
        reviewsByStoreId.get(peerStoreId) ?? [],
        DEFAULT_SCORE_WEIGHTS,
        DEFAULT_RECENCY_OPTIONS
      )
    )
    .filter((rawScore) => rawScore > 0);
  const rawAverage = calculateRawAverage(rawScores);
  const rawScore = calculateRecencyWeightedRawScore(
    targetReviews,
    DEFAULT_SCORE_WEIGHTS,
    DEFAULT_RECENCY_OPTIONS
  );
  const adjustedScore = calculateAdjustedScore({ rawScore, rawAverage });

  return {
    ...score,
    raw_score: rawScore,
    bayesian_raw_score: rawScore,
    adjusted_score: adjustedScore,
    ranking_score: adjustedScore,
    peer_average_raw_score: rawAverage
  };
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
    throwLoggedSupabaseError("stores", `Unable to load stores: ${error.message}`, error);
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
    throwLoggedSupabaseError("store-scores", `Unable to load store scores: ${scoreError.message}`, scoreError);
  }

  const reviewsByStoreId = await getScoringReviewsForStores(stores.map((store) => store.id));

  return mergeStoresWithScores(stores, scores ?? [], reviewsByStoreId);
}

export async function getStore(storeId: string) {
  const supabase = createClient();
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle<Store>();

  if (error) {
    throwLoggedSupabaseError("store", `Unable to load store: ${error.message}`, error);
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
    throwLoggedSupabaseError("store-score", `Unable to load store score: ${scoreError.message}`, scoreError);
  }

  const reviewsByStoreId = await getScoringReviewsForStores([store.id]);
  const storeReviews = reviewsByStoreId.get(store.id) ?? [];
  const computedScore = await computeDefaultScoreOverlay(store.id, score ?? null, storeReviews);

  return {
    ...store,
    score: computedScore,
    rising: buildRisingSignal(storeReviews)
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
    throwLoggedSupabaseError("store-reviews", `Unable to load reviews: ${error.message}`, error);
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
    throwLoggedSupabaseError("ranking", `Unable to load ranking: ${error.message}`, error);
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
    throwLoggedSupabaseError("ranked-stores", `Unable to load ranked stores: ${storeError.message}`, storeError);
  }

  const visibleStores = stores ?? [];
  const visibleStoreIds = visibleStores.map((store) => store.id);
  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
    .select(RANKING_REVIEW_SELECT)
    .in("store_id", visibleStoreIds)
    .eq("is_hidden", false)
    .eq("excluded_from_score", false)
    .returns<RankingReview[]>();

  let rankingReviews = reviews ?? [];

  if (reviewError && /text_completeness_weight|positive_text|negative_text/i.test(reviewError.message)) {
    const { data: legacyReviews, error: legacyReviewError } = await supabase
      .from("reviews")
      .select(LEGACY_RANKING_REVIEW_SELECT)
      .in("store_id", visibleStoreIds)
      .eq("is_hidden", false)
      .eq("excluded_from_score", false)
      .returns<RankingReviewWithoutSectionWeight[]>();

    if (legacyReviewError) {
      throwLoggedSupabaseError(
        "ranking-reviews.legacy",
        `Unable to load ranking reviews: ${legacyReviewError.message}`,
        legacyReviewError
      );
    }

    rankingReviews = (legacyReviews ?? []).map((review) => ({
      ...review,
      text_completeness_weight: 1
    }));
  } else if (reviewError) {
    throwLoggedSupabaseError("ranking-reviews", `Unable to load ranking reviews: ${reviewError.message}`, reviewError);
  }

  const reviewsByStoreId = groupReviewsByStore(rankingReviews);

  const storeById = new Map(visibleStores.map((store) => [store.id, store]));
  return scores
    .flatMap<StoreWithScoreAndReviews>((score) => {
      const store = storeById.get(score.store_id);
      const rankingReviews = store ? reviewsByStoreId.get(store.id) ?? [] : [];
      return store
        ? [
            {
              ...store,
              score,
              rising: buildRisingSignal(rankingReviews),
              ranking_reviews: rankingReviews
            }
          ]
        : [];
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
    throwLoggedSupabaseError("reports", `Unable to load reports: ${error.message}`, error);
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
    throwLoggedSupabaseError("admin-reviews", `Unable to load admin reviews: ${error.message}`, error);
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
