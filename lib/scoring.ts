export function clampScore(value: number, min = 1, max = 5) {
  return Math.min(max, Math.max(min, value));
}

export type ScoreWeights = {
  taste: number;
  service: number;
  environment: number;
};

export type RecencyOptions = {
  now?: Date;
  halfLifeDays?: number;
  minRecencyWeight?: number;
};

export type WeightedReviewInput = {
  taste_score: number;
  service_score: number;
  environment_score: number;
  created_at?: string | null;
  purchase_verified?: boolean | null;
};

export type RisingStoreSignal = {
  isRising: boolean;
  risingDelta: number;
  recentReviewCount: number;
  overallWeightedScore: number;
  recentWeightedScore: number;
};

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  taste: 0.5,
  service: 0.25,
  environment: 0.25
};

export const DEFAULT_RECENCY_OPTIONS = {
  halfLifeDays: 90,
  minRecencyWeight: 0.25
} satisfies Required<Omit<RecencyOptions, "now">>;

export const RECENT_WINDOW_DAYS = 30;
export const RISING_MIN_RECENT_REVIEWS = 5;
export const RISING_MIN_DELTA = 0.25;
export const RISING_MIN_RECENT_SCORE = 3.6;
export const PURCHASE_VERIFIED_WEIGHT = 1.0;
export const PURCHASE_UNVERIFIED_WEIGHT = 0.55;

function isFiniteNumber(value: number) {
  return Number.isFinite(value) && !Number.isNaN(value);
}

export function normalizeScoreWeights(input: ScoreWeights): ScoreWeights {
  const taste = Math.max(0, input.taste);
  const service = Math.max(0, input.service);
  const environment = Math.max(0, input.environment);
  const total = taste + service + environment;

  if (!isFiniteNumber(total) || total <= 0) {
    return DEFAULT_SCORE_WEIGHTS;
  }

  return {
    taste: taste / total,
    service: service / total,
    environment: environment / total
  };
}

export function calculateReviewScore(
  tasteScore: number,
  serviceScore: number,
  environmentScore: number,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
) {
  const normalizedWeights = normalizeScoreWeights(weights);

  return (
    tasteScore * normalizedWeights.taste +
    serviceScore * normalizedWeights.service +
    environmentScore * normalizedWeights.environment
  );
}

export function calculateQualityWeight(input: {
  reviewText?: string | null;
  photoUrl?: string | null;
  isHighScore?: boolean | null;
  highScoreReason?: string | null;
}) {
  const length = input.reviewText?.trim().length ?? 0;
  let weight = length < 10 ? 0.6 : length < 30 ? 0.8 : 1.0;

  if ((input.photoUrl?.trim().length ?? 0) > 0) {
    weight += 0.1;
  }

  if (input.isHighScore && (input.highScoreReason?.trim().length ?? 0) >= 10) {
    weight += 0.1;
  }

  return Math.min(1.2, Math.max(0.6, weight));
}

export function calculateRawAverage(rawScores: number[]) {
  const safeScores = rawScores.filter(isFiniteNumber);

  if (!safeScores.length) {
    return 3;
  }

  return safeScores.reduce((sum, score) => sum + score, 0) / safeScores.length;
}

export function calculateAdjustedScore(input: {
  rawScore: number;
  rawAverage: number;
}) {
  return clampScore(input.rawScore - input.rawAverage + 3);
}

export function mapRevisitRateToScore(revisitRate: number | null | undefined) {
  return clampScore((revisitRate ?? 0) * 5, 0, 5);
}

export function mapTrustWeightToScore(userWeight: number) {
  const normalized = (userWeight - 0.7) / 0.6;
  return clampScore(1 + 4 * normalized);
}

export function calculateRankingScore(input: {
  adjustedScore: number;
}) {
  return input.adjustedScore;
}

export function calculateRecencyWeight(
  createdAt: string | null | undefined,
  options: RecencyOptions = {}
) {
  if (!createdAt) {
    return 1;
  }

  const createdDate = new Date(createdAt);
  const createdTime = createdDate.getTime();

  if (!Number.isFinite(createdTime)) {
    return 1;
  }

  const now = options.now ?? new Date();
  const halfLifeDays = options.halfLifeDays ?? DEFAULT_RECENCY_OPTIONS.halfLifeDays;
  const minRecencyWeight =
    options.minRecencyWeight ?? DEFAULT_RECENCY_OPTIONS.minRecencyWeight;
  const ageMs = Math.max(0, now.getTime() - createdTime);
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (!isFiniteNumber(halfLifeDays) || halfLifeDays <= 0) {
    return Math.max(0, Math.min(1, minRecencyWeight));
  }

  return Math.max(minRecencyWeight, Math.pow(0.5, ageDays / halfLifeDays));
}

export function calculatePurchaseVerificationWeight(purchaseVerified: boolean | null | undefined) {
  return purchaseVerified === false ? PURCHASE_UNVERIFIED_WEIGHT : PURCHASE_VERIFIED_WEIGHT;
}

export function calculateRecencyWeightedRawScore(
  reviews: WeightedReviewInput[],
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
  options: RecencyOptions = {}
) {
  if (!reviews.length) {
    return 0;
  }

  const weighted = reviews.reduce(
    (acc, review) => {
      const recencyWeight = calculateRecencyWeight(review.created_at, options);
      const purchaseWeight = calculatePurchaseVerificationWeight(review.purchase_verified);
      const effectiveWeight = recencyWeight * purchaseWeight;
      const reviewScore = calculateReviewScore(
        review.taste_score,
        review.service_score,
        review.environment_score,
        weights
      );

      if (!isFiniteNumber(reviewScore) || !isFiniteNumber(effectiveWeight)) {
        return acc;
      }

      return {
        scoreSum: acc.scoreSum + reviewScore * effectiveWeight,
        weightSum: acc.weightSum + effectiveWeight
      };
    },
    { scoreSum: 0, weightSum: 0 }
  );

  if (weighted.weightSum <= 0) {
    return 0;
  }

  return weighted.scoreSum / weighted.weightSum;
}

export function isRecentReview(
  createdAt: string | null | undefined,
  options: { now?: Date; recentWindowDays?: number } = {}
) {
  if (!createdAt) {
    return false;
  }

  const createdDate = new Date(createdAt);
  const createdTime = createdDate.getTime();

  if (!Number.isFinite(createdTime)) {
    return false;
  }

  const now = options.now ?? new Date();
  const recentWindowDays = options.recentWindowDays ?? RECENT_WINDOW_DAYS;
  const windowStart = now.getTime() - recentWindowDays * 24 * 60 * 60 * 1000;

  return createdTime >= windowStart && createdTime <= now.getTime();
}

export function calculateRisingStoreSignal(
  reviews: WeightedReviewInput[],
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
  options: RecencyOptions & { recentWindowDays?: number } = {}
): RisingStoreSignal {
  const now = options.now ?? new Date();
  const recentReviews = reviews.filter((review) =>
    isRecentReview(review.created_at, {
      now,
      recentWindowDays: options.recentWindowDays ?? RECENT_WINDOW_DAYS
    })
  );
  const overallWeightedScore = calculateRecencyWeightedRawScore(reviews, weights, {
    ...options,
    now
  });
  const recentWeightedScore = calculateRecencyWeightedRawScore(recentReviews, weights, {
    ...options,
    now
  });
  const risingDelta = recentWeightedScore - overallWeightedScore;

  return {
    isRising:
      recentReviews.length >= RISING_MIN_RECENT_REVIEWS &&
      risingDelta >= RISING_MIN_DELTA &&
      recentWeightedScore >= RISING_MIN_RECENT_SCORE,
    risingDelta,
    recentReviewCount: recentReviews.length,
    overallWeightedScore,
    recentWeightedScore
  };
}
