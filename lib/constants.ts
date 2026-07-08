export const SCORE_EXPLANATION =
  "RAW Score는 사용자가 남긴 원래 리뷰 점수의 평균입니다. TT Index는 시장 평균 RAW 점수를 3.0으로 맞춘 뒤, 평균보다 높은 매장은 3.0보다 높게, 낮은 매장은 3.0보다 낮게 보여주는 참고 지표입니다.";

export const REVIEW_DIMENSIONS = [
  { key: "taste_score", label: "맛" },
  { key: "service_score", label: "서비스" },
  { key: "environment_score", label: "분위기" }
] as const;

export const STORE_CATEGORIES = [
  "Cafe",
  "Korean",
  "Japanese",
  "Chinese",
  "Western",
  "Bakery",
  "Dessert"
] as const;

export const STORE_REGIONS = [
  "Seoul Mapo",
  "Seoul Gangnam",
  "Seoul Jongno",
  "Busan Haeundae",
  "Incheon Songdo"
] as const;

export const REVISIT_RATE_EXPLANATION =
  "같은 사용자가 같은 매장에 다시 유효 리뷰를 남긴 비율입니다.";

export const VISIT_TYPES = ["solo", "date", "family", "friends", "business"] as const;

export const PRICE_SATISFACTION = ["good", "fair", "poor"] as const;

export const STORE_CATEGORY_LABELS: Record<string, string> = {
  Cafe: "카페",
  Korean: "한식",
  Japanese: "일식",
  Chinese: "중식",
  Western: "양식",
  Bakery: "베이커리",
  Dessert: "디저트"
};

export const STORE_REGION_LABELS: Record<string, string> = {
  "Seoul Mapo": "서울 마포",
  "Seoul Gangnam": "서울 강남",
  "Seoul Jongno": "서울 종로",
  "Busan Haeundae": "부산 해운대",
  "Incheon Songdo": "인천 송도",
  "Seoul Seongsu": "서울 성수",
  "Busan Jeonpo": "부산 전포",
  "Daegu Dongseongro": "대구 동성로"
};

export const VISIT_TYPE_LABELS: Record<string, string> = {
  solo: "혼자",
  date: "데이트",
  family: "가족",
  friends: "친구",
  business: "업무"
};

export const PRICE_SATISFACTION_LABELS: Record<string, string> = {
  good: "좋음",
  fair: "보통",
  poor: "아쉬움"
};

export function formatCategoryLabel(value: string | null | undefined) {
  return value ? STORE_CATEGORY_LABELS[value] ?? value : "";
}

export function formatRegionLabel(value: string | null | undefined) {
  return value ? STORE_REGION_LABELS[value] ?? value : "";
}
