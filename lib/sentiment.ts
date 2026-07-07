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

type SignalPattern = {
  label: string;
  terms: string[];
  strong?: boolean;
};

const NEGATIVE_PATTERNS: SignalPattern[] = [
  { label: "맛없", terms: ["맛없", "맛이없", "맛이 없"], strong: true },
  { label: "최악", terms: ["최악"], strong: true },
  { label: "비추천", terms: ["비추천", "비추"], strong: true },
  { label: "다시는안", terms: ["다시는안", "다시는 안", "다신안", "다신 안"], strong: true },
  { label: "끔찍", terms: ["끔찍"], strong: true },
  { label: "형편없", terms: ["형편없", "형편 없"], strong: true },
  { label: "불친절", terms: ["불친절"] },
  { label: "실망", terms: ["실망"] },
  { label: "별로", terms: ["별로"] },
  { label: "후회", terms: ["후회"] },
  { label: "느림", terms: ["느림", "느리", "늦게"] },
  { label: "짜다", terms: ["짜다", "짜고", "짰"] },
  { label: "싱겁다", terms: ["싱겁다", "싱거"] },
  { label: "비싸다", terms: ["비싸다", "비싸", "비쌌"] },
  { label: "위생", terms: ["위생"] },
  { label: "불만", terms: ["불만"] },
  { label: "환불", terms: ["환불"] },
  { label: "아쉽", terms: ["아쉽", "아쉬"] },
  { label: "기대 이하", terms: ["기대이하", "기대 이하"] },
  { label: "냄새", terms: ["냄새"] },
  { label: "불쾌", terms: ["불쾌"] },
  { label: "딱딱", terms: ["딱딱"] },
  { label: "차갑", terms: ["차갑"] },
  { label: "누락", terms: ["누락"] },
  { label: "잘못", terms: ["잘못"] },
  { label: "문제", terms: ["문제"] }
];

const POSITIVE_PATTERNS: SignalPattern[] = [
  { label: "최고", terms: ["최고"], strong: true },
  { label: "맛있", terms: ["맛있", "맛이 있"], strong: true },
  { label: "친절", terms: ["친절"] },
  { label: "좋음", terms: ["좋았", "좋아요", "좋다", "좋고"] },
  { label: "만족", terms: ["만족"] },
  { label: "추천", terms: ["추천"] },
  { label: "훌륭", terms: ["훌륭"] },
  { label: "깔끔", terms: ["깔끔"] },
  { label: "신선", terms: ["신선"] },
  { label: "재방문", terms: ["재방문"] }
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

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(text: string) {
  const normalizedText = text.trim().toLowerCase();

  return {
    normalizedText,
    compactText: normalizedText.replace(/\s+/g, "")
  };
}

function collectSignals(text: string, patterns: SignalPattern[]) {
  const { normalizedText, compactText } = normalizeText(text);
  const matches: SignalPattern[] = [];

  for (const pattern of patterns) {
    const hasMatch = pattern.terms.some((term) => {
      const normalizedTerm = term.toLowerCase();
      const compactTerm = normalizedTerm.replace(/\s+/g, "");

      return normalizedText.includes(normalizedTerm) || compactText.includes(compactTerm);
    });

    if (hasMatch) {
      matches.push(pattern);
    }
  }

  return matches;
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
    const text = reviewText.trim();

    if (!text) {
      return emptyResult();
    }

    const negativeMatches = collectSignals(text, NEGATIVE_PATTERNS);
    const positiveMatches = collectSignals(text, POSITIVE_PATTERNS);
    const mixedMarkers = collectSignals(text, MIXED_MARKERS.map((term) => ({ label: term, terms: [term] })));
    const negativeSignals = negativeMatches.map((match) => match.label);
    const negativeSignalCount = negativeSignals.length;
    const positiveSignalCount = positiveMatches.length;
    const strongNegativeCount = negativeMatches.filter((match) => match.strong).length;
    const strongPositiveCount = positiveMatches.filter((match) => match.strong).length;
    const lengthFactor = clamp(text.length / 120, 0, 0.18);
    const mixedOffset = mixedMarkers.length ? 0.18 : 0;
    const negativeConfidence = clamp(
      negativeSignalCount * 0.2 + strongNegativeCount * 0.34 + lengthFactor - mixedOffset
    );
    const positiveConfidence = clamp(
      positiveSignalCount * 0.2 + strongPositiveCount * 0.28 + lengthFactor - mixedOffset
    );
    const sentimentLabel: SentimentLabel =
      negativeConfidence > positiveConfidence && negativeConfidence >= 0.45
        ? "negative"
        : positiveConfidence > negativeConfidence && positiveConfidence >= 0.45
          ? "positive"
          : "neutral";
    const reviewScore = resolveReviewScore(options);
    const highRating = reviewScore >= 4.0;
    const lowRating = reviewScore <= 2.0;
    const negativeText =
      strongNegativeCount >= 1 ||
      negativeConfidence >= 0.6 ||
      (negativeSignalCount >= 2 && positiveSignalCount === 0);
    const positiveText =
      strongPositiveCount >= 1 ||
      positiveConfidence >= 0.6 ||
      (positiveSignalCount >= 2 && negativeSignalCount === 0);
    const highRatingNegativeText = highRating && negativeText;
    const lowRatingPositiveText = lowRating && positiveText;
    const ratingTextMismatch = highRatingNegativeText || lowRatingPositiveText;
    const mismatchConfidence = ratingTextMismatch
      ? highRatingNegativeText
        ? Math.max(negativeConfidence, strongNegativeCount ? 0.82 : 0)
        : Math.max(positiveConfidence, strongPositiveCount ? 0.78 : 0)
      : 0;

    return {
      sentimentLabel,
      sentimentScore:
        sentimentLabel === "negative"
          ? -negativeConfidence
          : sentimentLabel === "positive"
            ? positiveConfidence
            : 0,
      negativeSignalCount,
      negativeSignals,
      ratingTextMismatch,
      mismatchReason: ratingTextMismatch
        ? highRatingNegativeText
          ? "높은 점수와 부정적인 리뷰 내용이 함께 감지되었습니다."
          : "낮은 점수와 긍정적인 리뷰 내용이 함께 감지되었습니다."
        : null,
      mismatchConfidence
    };
  } catch (error) {
    console.error("Review sentiment analysis failed", error);
    return emptyResult();
  }
}
