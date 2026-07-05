export const SCORE_PRIOR_REVIEW_COUNT = 20;
export const PEER_REVIEW_THRESHOLD = 30;

export function clampScore(value: number, min = 1, max = 5) {
  return Math.min(max, Math.max(min, value));
}

export function calculateReviewScore(
  tasteScore: number,
  serviceScore: number,
  environmentScore: number
) {
  return tasteScore * 0.5 + serviceScore * 0.25 + environmentScore * 0.25;
}

export function calculateQualityWeight(input: {
  reviewText?: string | null;
  photoUrl?: string | null;
  isHighScore?: boolean | null;
  highScoreReason?: string | null;
  revisitIntent?: string | null;
}) {
  const length = input.reviewText?.trim().length ?? 0;
  let weight = length < 10 ? 0.6 : length < 30 ? 0.8 : 1.0;

  if ((input.photoUrl?.trim().length ?? 0) > 0) {
    weight += 0.1;
  }

  if (input.isHighScore && (input.highScoreReason?.trim().length ?? 0) >= 10) {
    weight += 0.1;
  }

  if (input.revisitIntent) {
    weight += 0.05;
  }

  return Math.min(1.2, Math.max(0.6, weight));
}

export function calculateBayesianRawScore(input: {
  reviewCount: number;
  rawScore: number;
  peerAverageRawScore: number;
}) {
  const { reviewCount, rawScore, peerAverageRawScore } = input;
  return (
    (reviewCount * rawScore + SCORE_PRIOR_REVIEW_COUNT * peerAverageRawScore) /
    (reviewCount + SCORE_PRIOR_REVIEW_COUNT)
  );
}

export function calculateAdjustedScore(input: {
  bayesianRawScore: number;
  peerAverageRawScore: number;
}) {
  return clampScore(3 + 0.8 * (input.bayesianRawScore - input.peerAverageRawScore));
}

export function mapRevisitRateToScore(revisitIntentRate: number) {
  return clampScore(1 + 4 * revisitIntentRate);
}

export function mapTrustWeightToScore(userWeight: number) {
  const normalized = (userWeight - 0.7) / 0.6;
  return clampScore(1 + 4 * normalized);
}

export function calculateRankingScore(input: {
  adjustedScore: number;
  revisitIntentRate: number;
  averageTrustWeight: number;
}) {
  return (
    input.adjustedScore * 0.75 +
    mapRevisitRateToScore(input.revisitIntentRate) * 0.1 +
    mapTrustWeightToScore(input.averageTrustWeight) * 0.15
  );
}
