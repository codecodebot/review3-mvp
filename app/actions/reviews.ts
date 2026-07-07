"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateReviewScore } from "@/lib/scoring";

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
  const highScoreReason = optionalStringValue(formData, "high_score_reason");

  if (!storeId) {
    throw new Error("매장 ID가 필요합니다.");
  }

  if (reviewScore >= 4.5 && (!highScoreReason || highScoreReason.length < 10)) {
    throw new Error("고득점 리뷰는 10자 이상의 이유가 필요합니다.");
  }

  const { error } = await supabase.from("reviews").insert({
    store_id: storeId,
    user_id: user.id,
    taste_score: tasteScore,
    service_score: serviceScore,
    environment_score: environmentScore,
    review_score: reviewScore,
    review_text: optionalStringValue(formData, "review_text"),
    photo_url: optionalStringValue(formData, "photo_url"),
    visit_type: optionalStringValue(formData, "visit_type"),
    price_satisfaction: optionalStringValue(formData, "price_satisfaction"),
    is_high_score: reviewScore >= 4.5,
    high_score_reason: highScoreReason
  });

  if (error) {
    throw new Error(`리뷰를 만들 수 없습니다: ${error.message}`);
  }

  await supabase.rpc("recalculate_profile_stats", { input_user_id: user.id });
  await supabase.rpc("refresh_store_score_cache", { input_store_id: storeId });

  revalidatePath("/stores");
  revalidatePath("/ranking");
  revalidatePath(`/stores/${storeId}`);
  redirect(`/stores/${storeId}`);
}
