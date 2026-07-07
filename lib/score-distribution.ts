export type ScoreDistributionBucket = {
  range: string;
  label: string;
  min: number | null;
  max: number | null;
  count: number;
  percentage: number;
};

type BucketDefinition = Omit<ScoreDistributionBucket, "count" | "percentage">;

const BUCKETS: BucketDefinition[] = [
  { range: "4.0 이상", label: "매우 강한 긍정 신호", min: 4.0, max: null },
  { range: "3.6 - 4.0", label: "강한 긍정 신호", min: 3.6, max: 4.0 },
  { range: "3.3 - 3.6", label: "평균 이상", min: 3.3, max: 3.6 },
  { range: "3.0 - 3.3", label: "평균보다 약간 높음", min: 3.0, max: 3.3 },
  { range: "2.7 - 3.0", label: "평균선 근처", min: 2.7, max: 3.0 },
  { range: "2.7 미만", label: "추가 검토 필요", min: null, max: 2.7 }
];

function isInBucket(score: number, bucket: BucketDefinition) {
  const aboveMin = bucket.min === null || score >= bucket.min;
  const belowMax = bucket.max === null || score < bucket.max;

  return aboveMin && belowMax;
}

export function calculateScoreDistribution(scores: number[]): ScoreDistributionBucket[] {
  const safeScores = scores.filter((score) => Number.isFinite(score));
  const total = safeScores.length;

  return BUCKETS.map((bucket) => {
    const count = safeScores.filter((score) => isInBucket(score, bucket)).length;
    const percentage = total ? Math.round((count / total) * 1000) / 10 : 0;

    return {
      ...bucket,
      count,
      percentage
    };
  });
}

export function representativeTtScores() {
  const buckets = [
    { count: 2, value: 4.08 },
    { count: 8, value: 3.78 },
    { count: 18, value: 3.44 },
    { count: 24, value: 3.16 },
    { count: 31, value: 2.88 },
    { count: 17, value: 2.58 }
  ];

  return buckets.flatMap((bucket) => Array.from({ length: bucket.count }, () => bucket.value));
}
