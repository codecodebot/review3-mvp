import { analyzeReviewSentiment } from "@/lib/sentiment";

export type SentimentTestCase = {
  name: string;
  reviewScore: number;
  text: string;
  expectedMismatch: boolean;
};

export const sentimentTestCases: SentimentTestCase[] = [
  {
    name: "5점 + 강한 부정 본문",
    reviewScore: 5,
    text: "정말 맛이 없고 최악의 음식점",
    expectedMismatch: true
  },
  {
    name: "5점 + 긍정 본문",
    reviewScore: 5,
    text: "정말 최고였고 맛있다",
    expectedMismatch: false
  },
  {
    name: "1점 + 긍정 본문",
    reviewScore: 1,
    text: "정말 최고였고 맛있다",
    expectedMismatch: true
  },
  {
    name: "1점 + 강한 부정 본문",
    reviewScore: 1,
    text: "정말 맛없고 최악이다",
    expectedMismatch: false
  }
];

export async function evaluateSentimentTestCases() {
  return Promise.all(
    sentimentTestCases.map(async (testCase) => {
      const result = await analyzeReviewSentiment(testCase.text, {
        reviewScore: testCase.reviewScore
      });

      return {
        ...testCase,
        actualMismatch: result.ratingTextMismatch,
        passed: result.ratingTextMismatch === testCase.expectedMismatch,
        result
      };
    })
  );
}
