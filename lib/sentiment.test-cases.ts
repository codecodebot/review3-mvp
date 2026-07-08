import { analyzeReviewSections, analyzeReviewSentiment } from "@/lib/sentiment";

export type SentimentTestCase = {
  name: string;
  reviewScore: number;
  text: string;
  expectedMismatch: boolean;
};

export type SectionSentimentTestCase = {
  name: string;
  positiveText: string | null;
  negativeText: string | null;
  expectedSectionMismatch: boolean;
  expectedWeight: number;
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

export const sectionSentimentTestCases: SectionSentimentTestCase[] = [
  {
    name: "정상 섹션 입력",
    positiveText: "음식이 맛있고 직원분들도 친절했습니다.",
    negativeText: "대기 시간이 조금 길었습니다.",
    expectedSectionMismatch: false,
    expectedWeight: 1.06
  },
  {
    name: "좋았던 점에 강한 부정 표현",
    positiveText: "정말 맛이 없고 최악의 음식점입니다.",
    negativeText: null,
    expectedSectionMismatch: true,
    expectedWeight: 1
  },
  {
    name: "아쉬웠던 점에 강한 긍정 표현",
    positiveText: null,
    negativeText: "정말 최고였고 맛있었습니다.",
    expectedSectionMismatch: true,
    expectedWeight: 1
  },
  {
    name: "빈 섹션",
    positiveText: null,
    negativeText: null,
    expectedSectionMismatch: false,
    expectedWeight: 1
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

export async function evaluateSectionSentimentTestCases() {
  return Promise.all(
    sectionSentimentTestCases.map(async (testCase) => {
      const result = await analyzeReviewSections({
        positiveText: testCase.positiveText,
        negativeText: testCase.negativeText
      });

      return {
        ...testCase,
        actualSectionMismatch: result.sectionSentimentMismatch,
        actualWeight: result.textCompletenessWeight,
        passed:
          result.sectionSentimentMismatch === testCase.expectedSectionMismatch &&
          result.textCompletenessWeight === testCase.expectedWeight,
        result
      };
    })
  );
}
