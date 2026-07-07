"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function recordAdminAction(input: {
  actionType: string;
  targetType: string;
  targetId: string;
  memo?: string;
}) {
  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("admin_actions").insert({
    admin_id: userId,
    action_type: input.actionType,
    target_type: input.targetType,
    target_id: input.targetId,
    memo: input.memo ?? null
  });

  if (error) {
    throw new Error(`관리자 작업을 기록할 수 없습니다: ${error.message}`);
  }

  return { supabase, userId };
}

export async function markReportResolvedAction(formData: FormData) {
  const reportId = stringValue(formData, "report_id");
  const { supabase } = await recordAdminAction({
    actionType: "resolve_report",
    targetType: "report",
    targetId: reportId
  });

  const { error } = await supabase
    .from("reports")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString()
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(`신고를 처리할 수 없습니다: ${error.message}`);
  }

  revalidatePath("/admin/reports");
}

export async function toggleReviewHiddenAction(formData: FormData) {
  const reviewId = stringValue(formData, "review_id");
  const storeId = stringValue(formData, "store_id");
  const userId = stringValue(formData, "user_id");
  const isHidden = stringValue(formData, "is_hidden") === "true";
  const { supabase } = await recordAdminAction({
    actionType: isHidden ? "hide_review" : "unhide_review",
    targetType: "review",
    targetId: reviewId
  });

  const { error } = await supabase.from("reviews").update({ is_hidden: isHidden }).eq("id", reviewId);

  if (error) {
    throw new Error(`리뷰 표시 상태를 수정할 수 없습니다: ${error.message}`);
  }

  await supabase.rpc("recalculate_profile_stats", { input_user_id: userId });
  await supabase.rpc("refresh_store_score_cache", { input_store_id: storeId });

  revalidatePath("/admin/reviews");
  revalidatePath("/ranking");
  revalidatePath(`/stores/${storeId}`);
}

export async function toggleReviewExcludedAction(formData: FormData) {
  const reviewId = stringValue(formData, "review_id");
  const storeId = stringValue(formData, "store_id");
  const userId = stringValue(formData, "user_id");
  const excludedFromScore = stringValue(formData, "excluded_from_score") === "true";
  const { supabase } = await recordAdminAction({
    actionType: excludedFromScore ? "exclude_review" : "include_review",
    targetType: "review",
    targetId: reviewId
  });

  const { error } = await supabase
    .from("reviews")
    .update({ excluded_from_score: excludedFromScore })
    .eq("id", reviewId);

  if (error) {
    throw new Error(`점수 제외 상태를 수정할 수 없습니다: ${error.message}`);
  }

  await supabase.rpc("recalculate_profile_stats", { input_user_id: userId });
  await supabase.rpc("refresh_store_score_cache", { input_store_id: storeId });

  revalidatePath("/admin/reviews");
  revalidatePath("/ranking");
  revalidatePath(`/stores/${storeId}`);
}

export async function updateStoreModerationAction(formData: FormData) {
  const storeId = stringValue(formData, "store_id");
  const verificationStatus = stringValue(formData, "verification_status") || "pending";
  const rankingLimited = formData.get("ranking_limited") === "on";
  const { supabase } = await recordAdminAction({
    actionType: "update_store_moderation",
    targetType: "store",
    targetId: storeId,
    memo: `verification_status=${verificationStatus}; ranking_limited=${rankingLimited}`
  });

  const { error } = await supabase
    .from("stores")
    .update({
      verification_status: verificationStatus,
      ranking_limited: rankingLimited
    })
    .eq("id", storeId);

  if (error) {
    throw new Error(`매장 관리 상태를 수정할 수 없습니다: ${error.message}`);
  }

  await supabase.rpc("refresh_store_score_cache", { input_store_id: storeId });

  revalidatePath("/admin/stores");
  revalidatePath("/stores");
  revalidatePath("/ranking");
  revalidatePath(`/stores/${storeId}`);
}
