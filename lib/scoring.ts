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
  if (!rawScores.length) {
    return 3;
  }

  return rawScores.reduce((sum, score) => sum + score, 0) / rawScores.length;
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
