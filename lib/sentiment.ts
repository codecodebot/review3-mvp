import { calculateReviewScore } from "@/lib/scoring";

export type SentimentLabel = "positive" | "neutral" | "negative";

export type ReviewSentimentResult = {
  sentimentLabel: SentimentLabel;
  sentimentScore: number;
  negativeSignalCount: number;
  negativeSignals: string[];
  ratingTextMismatch: boolean;
  mismatchReason: string | null;
  mismatchConfidence: number;
};

type AnalyzeReviewSentimentOptions = {
  reviewScore?: number;
  tasteScore?: number;
  serviceScore?: number;
  environmentScore?: number;
};

const NEGATIVE_TERMS = [
  "별로",
  "실망",
  "최악",
  "다시는",
  "비추",
  "맛없",
  "불친절",
  "느림",
  "느리",
  "늦게",
  "짜다",
  "싱겁다",
  "비싸다",
  "비싸",
  "비쌌",
  "위생",
  "불만",
  "환불",
  "아쉽",
  "아쉬",
  "기대 이하",
  "냄새",
  "불쾌",
  "딱딱",
  "차갑",
  "누락",
  "잘못",
  "문제"
];

const STRONG_NEGATIVE_TERMS = new Set([
  "최악",
  "다시는",
  "비추",
  "맛없",
  "불친절",
  "환불",
  "불쾌",
  "위생"
]);

const POSITIVE_TERMS = [
  "맛있",
  "친절",
  "좋았",
  "좋아요",
  "만족",
  "추천",
  "훌륭",
  "깔끔",
  "신선",
  "괜찮",
  "재방문"
];

const MIXED_MARKERS = ["하지만", "그렇지만", "다만", "그래도", "아쉽지만", "반면"];

function emptyResult(): ReviewSentimentResult {
  return {
    sentimentLabel: "neutral",
    sentimentScore: 0,
    negativeSignalCount: 0,
    negativeSignals: [],
    ratingTextMismatch: false,
    mismatchReason: null,
    mismatchConfidence: 0
  };
}

function uniqueMatches(text: string, terms: string[]) {
  return terms.filter((term) => text.includes(term));
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function resolveReviewScore(options: AnalyzeReviewSentimentOptions) {
  if (typeof options.reviewScore === "number" && Number.isFinite(options.reviewScore)) {
    return options.reviewScore;
  }

  if (
    typeof options.tasteScore === "number" &&
    typeof options.serviceScore === "number" &&
    typeof options.environmentScore === "number"
  ) {
    return calculateReviewScore(options.tasteScore, options.serviceScore, options.environmentScore);
  }

  return 0;
}

export async function analyzeReviewSentiment(
  reviewText: string,
  options: AnalyzeReviewSentimentOptions = {}
): Promise<ReviewSentimentResult> {
  try {
    const normalizedText = reviewText.trim().toLowerCase();

    if (!normalizedText) {
      return emptyResult();
    }

    const negativeSignals = uniqueMatches(normalizedText, NEGATIVE_TERMS);
    const positiveSignals = uniqueMatches(normalizedText, POSITIVE_TERMS);
    const mixedMarkers = uniqueMatches(normalizedText, MIXED_MARKERS);
    const strongNegativeCount = negativeSignals.filter((term) =>
      STRONG_NEGATIVE_TERMS.has(term)
    ).length;
    const negativeSignalCount = negativeSignals.length;
    const lengthFactor = clamp(normalizedText.length / 120, 0, 0.18);
    const positiveOffset = positiveSignals.length ? Math.min(0.25, positiveSignals.length * 0.08) : 0;
    const mixedOffset = mixedMarkers.length ? 0.18 : 0;
    const weakSingleNegativeOffset = negativeSignalCount === 1 && strongNegativeCount === 0 ? 0.16 : 0;
    const confidence = clamp(
      negativeSignalCount * 0.2 +
        strongNegativeCount * 0.18 +
        lengthFactor -
        positiveOffset -
        mixedOffset -
        weakSingleNegativeOffset
    );
    const hasClearNegativeSignals =
      negativeSignalCount >= 2 && positiveSignals.length === 0 && mixedMarkers.length === 0;
    const sentimentLabel: SentimentLabel =
      confidence >= 0.6 || strongNegativeCount >= 2 || hasClearNegativeSignals
        ? "negative"
        : positiveSignals.length > negativeSignalCount
          ? "positive"
          : "neutral";
    const reviewScore = resolveReviewScore(options);
    const highRating = reviewScore >= 4.0;
    const strongNegativeText = strongNegativeCount >= 2;
    const negativeText = (sentimentLabel === "negative" && confidence >= 0.6) || strongNegativeText;
    const ratingTextMismatch = highRating && negativeText;
    const mismatchConfidence = ratingTextMismatch ? confidence : 0;

    return {
      sentimentLabel,
      sentimentScore:
        sentimentLabel === "negative"
          ? -confidence
          : sentimentLabel === "positive"
            ? clamp(0.4 + positiveSignals.length * 0.12)
            : 0,
      negativeSignalCount,
      negativeSignals,
      ratingTextMismatch,
      mismatchReason: ratingTextMismatch
        ? "높은 점수와 부정적인 리뷰 내용이 함께 감지되었습니다."
        : null,
      mismatchConfidence
    };
  } catch (error) {
    console.error("Review sentiment analysis failed", error);
    return emptyResult();
  }
}
