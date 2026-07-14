export type ScoreDistributionBucket = {
  range: string;
  label: string;
  min: number | null;
  max: number | null;
  count: number;
  percentage: number;
};

export type ScoreDistributionSummary = {
  rawDistribution: ScoreDistributionBucket[];
  ttDistribution: ScoreDistributionBucket[];
  rawAverage: number;
  ttAverage: number;
  storeCount: number;
  marketAverageLine: number;
};

type BucketDefinition = Omit<ScoreDistributionBucket, "count" | "percentage">;

const SCORE_BUCKETS: BucketDefinition[] = [
  { range: "4.0 이상", label: "매우 강한 긍정 신호", min: 4.0, max: null },
  { range: "3.6 - 4.0", label: "강한 긍정 신호", min: 3.6, max: 4.0 },
  { range: "3.3 - 3.6", label: "평균 이상", min: 3.3, max: 3.6 },
  { range: "3.0 - 3.3", label: "평균보다 약간 우수", min: 3.0, max: 3.3 },
  { range: "2.7 - 3.0", label: "평균권", min: 2.7, max: 3.0 },
  { range: "2.7 미만", label: "추가 검토 필요", min: null, max: 2.7 }
];

function average(values: number[]) {
  const safeValues = values.filter((value) => Number.isFinite(value));

  if (!safeValues.length) {
    return 0;
  }

  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function isInBucket(score: number, bucket: BucketDefinition) {
  const aboveMin = bucket.min === null || score >= bucket.min;
  const belowMax = bucket.max === null || score < bucket.max;

  return aboveMin && belowMax;
}

function calculateBuckets(scores: number[], buckets: BucketDefinition[]) {
  const safeScores = scores.filter((score) => Number.isFinite(score));
  const total = safeScores.length;

  return buckets.map((bucket) => {
    const count = safeScores.filter((score) => isInBucket(score, bucket)).length;
    const percentage = total ? Math.round((count / total) * 1000) / 10 : 0;

    return {
      ...bucket,
      count,
      percentage
    };
  });
}

export function calculateScoreDistributionSummary(input: {
  rawScores: number[];
  ttScores: number[];
}): ScoreDistributionSummary {
  const rawScores = input.rawScores.filter((score) => Number.isFinite(score));
  const ttScores = input.ttScores.filter((score) => Number.isFinite(score));
  const storeCount = Math.min(rawScores.length, ttScores.length);

  return {
    rawDistribution: calculateBuckets(rawScores, SCORE_BUCKETS),
    ttDistribution: calculateBuckets(ttScores, SCORE_BUCKETS),
    rawAverage: average(rawScores),
    ttAverage: average(ttScores),
    storeCount,
    marketAverageLine: 3.0
  };
}
