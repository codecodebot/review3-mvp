export const SCORE_EXPLANATION =
  "RAW score is the original weighted average from reviews. Adjusted score compares the store against the same region/category average and centers the peer group around 3.0.";

export const REVIEW_DIMENSIONS = [
  { key: "taste_score", label: "Taste" },
  { key: "service_score", label: "Service" },
  { key: "environment_score", label: "Environment" }
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

export const REVISIT_INTENTS = ["yes", "no", "unsure"] as const;

export const VISIT_TYPES = ["solo", "date", "family", "friends", "business"] as const;

export const PRICE_SATISFACTION = ["good", "fair", "poor"] as const;
