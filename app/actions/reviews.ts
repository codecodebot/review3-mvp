"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateReviewScore } from "@/lib/scoring";
import { analyzeReviewSections } from "@/lib/sentiment";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length ? value : null;
}

function scoreValue(formData: FormData, key: string) {
  const value = Number(stringValue(formData, key));

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${key} 값은 1부터 5까지의 정수여야 합니다.`);
  }

  return value;
}

function buildLegacyReviewText(positiveText: string | null, negativeText: string | null) {
  const sections = [
    positiveText ? `좋았던 점\n${positiveText}` : null,
    negativeText ? `아쉬웠던 점\n${negativeText}` : null
  ].filter((value): value is string => Boolean(value));

  return sections.length ? sections.join("\n\n") : null;
}

export async function createReviewAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const storeId = stringValue(formData, "store_id");

  if (!user) {
    redirect(`/login?returnTo=/stores/${storeId}/review`);
  }

  const tasteScore = scoreValue(formData, "taste_score");
  const serviceScore = scoreValue(formData, "service_score");
  const environmentScore = scoreValue(formData, "environment_score");
  const reviewScore = calculateReviewScore(tasteScore, serviceScore, environmentScore);
  const positiveText = optionalStringValue(formData, "positive_text");
  const negativeText = optionalStringValue(formData, "negative_text");
  const reviewText = buildLegacyReviewText(positiveText, negativeText);

  if (!storeId) {
    throw new Error("매장 ID가 필요합니다.");
  }

  const sectionSentiment = await analyzeReviewSections({ positiveText, negativeText });
  const insertPayload = {
    store_id: storeId,
    user_id: user.id,
    taste_score: tasteScore,
    service_score: serviceScore,
    environment_score: environmentScore,
    review_score: reviewScore,
    review_text: reviewText,
    positive_text: positiveText,
    negative_text: negativeText,
    photo_url: optionalStringValue(formData, "photo_url"),
    visit_type: optionalStringValue(formData, "visit_type"),
    price_satisfaction: optionalStringValue(formData, "price_satisfaction"),
    is_high_score: reviewScore >= 4.5,
    high_score_reason: null,
    sentiment_label: "neutral",
    sentiment_score: 0,
    negative_signal_count: 0,
    negative_signals: [],
    rating_text_mismatch: false,
    mismatch_reason: null,
    mismatch_confidence: 0,
    section_sentiment_mismatch: sectionSentiment.sectionSentimentMismatch,
    section_mismatch_reason: sectionSentiment.sectionMismatchReason,
    positive_text_sentiment_label: sectionSentiment.positiveTextSentiment?.sentimentLabel ?? null,
    negative_text_sentiment_label: sectionSentiment.negativeTextSentiment?.sentimentLabel ?? null,
    positive_text_sentiment_score: sectionSentiment.positiveTextSentiment?.sentimentScore ?? null,
    negative_text_sentiment_score: sectionSentiment.negativeTextSentiment?.sentimentScore ?? null,
    text_completeness_weight: sectionSentiment.textCompletenessWeight
  } satisfies Database["public"]["Tables"]["reviews"]["Insert"];

  const { error } = await supabase.from("reviews").insert(insertPayload);

  if (
    error &&
    /sentiment|negative_signal|rating_text_mismatch|mismatch|positive_text|negative_text|text_completeness/i.test(
      error.message
    )
  ) {
    console.error("Review sentiment section columns unavailable; retrying without section fields", error);
    const {
      positive_text: _positiveText,
      negative_text: _negativeText,
      section_sentiment_mismatch: _sectionSentimentMismatch,
      section_mismatch_reason: _sectionMismatchReason,
      positive_text_sentiment_label: _positiveTextSentimentLabel,
      negative_text_sentiment_label: _negativeTextSentimentLabel,
      positive_text_sentiment_score: _positiveTextSentimentScore,
      negative_text_sentiment_score: _negativeTextSentimentScore,
      text_completeness_weight: _textCompletenessWeight,
      sentiment_label: _sentimentLabel,
      sentiment_score: _sentimentScore,
      negative_signal_count: _negativeSignalCount,
      negative_signals: _negativeSignals,
      rating_text_mismatch: _ratingTextMismatch,
      mismatch_reason: _mismatchReason,
      mismatch_confidence: _mismatchConfidence,
      ...fallbackPayload
    } = insertPayload;
    const { error: fallbackError } = await supabase.from("reviews").insert(fallbackPayload);

    if (fallbackError) {
      throw new Error(`리뷰를 만들 수 없습니다: ${fallbackError.message}`);
    }
  } else if (error) {
    throw new Error(`리뷰를 만들 수 없습니다: ${error.message}`);
  }

  await supabase.rpc("recalculate_profile_stats", { input_user_id: user.id });
  await supabase.rpc("refresh_store_score_cache", { input_store_id: storeId });

  revalidatePath("/stores");
  revalidatePath("/ranking");
  revalidatePath(`/stores/${storeId}`);
  redirect(`/stores/${storeId}`);
}
