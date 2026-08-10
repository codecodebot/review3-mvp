"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin";
import { STORE_CATEGORIES, STORE_REGIONS } from "@/lib/constants";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(formData: FormData, key: string, label: string, min: number, max: number) {
  const value = stringValue(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} 값이 올바르지 않습니다.`);
  }

  return parsed;
}

function optionalPrice(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value.replace(/,/g, ""), 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("메뉴 가격 값이 올바르지 않습니다.");
  }

  return parsed;
}

export async function createStoreAction(formData: FormData) {
  const { supabase } = await assertAdmin();
  const name = stringValue(formData, "name");
  const category = stringValue(formData, "category");
  const region = stringValue(formData, "region");
  const address = stringValue(formData, "address") || null;
  const lat = optionalNumber(formData, "lat", "위도", -90, 90);
  const lng = optionalNumber(formData, "lng", "경도", -180, 180);

  if (!name) {
    throw new Error("매장명을 입력해 주세요.");
  }

  if (!STORE_CATEGORIES.includes(category as (typeof STORE_CATEGORIES)[number])) {
    throw new Error("카테고리를 선택해 주세요.");
  }

  if (!STORE_REGIONS.includes(region as (typeof STORE_REGIONS)[number])) {
    throw new Error("지역을 선택해 주세요.");
  }

  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      name,
      category,
      region,
      address,
      lat,
      lng,
      verification_status: "pending",
      ranking_limited: false,
      is_synthetic: false
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(`매장을 등록할 수 없습니다: ${error.message}`);
  }

  const menuNames = formData.getAll("menu_name");
  const menuPrices = formData.getAll("menu_price");
  const menuDescriptions = formData.getAll("menu_description");
  const signatureIndexes = new Set(
    formData
      .getAll("menu_signature")
      .filter((value): value is string => typeof value === "string")
  );

  const menus = menuNames.flatMap((value, index) => {
    const menuName = typeof value === "string" ? value.trim() : "";

    if (!menuName) {
      return [];
    }

    const descriptionValue = menuDescriptions[index];
    const description =
      typeof descriptionValue === "string" && descriptionValue.trim()
        ? descriptionValue.trim()
        : null;

    return [
      {
        store_id: store.id,
        name: menuName,
        price: optionalPrice(menuPrices[index] ?? null),
        description,
        is_signature: signatureIndexes.has(String(index)),
        position: index
      }
    ];
  });

  if (menus.length) {
    const { error: menuError } = await supabase.from("store_menus").insert(menus);

    if (menuError) {
      throw new Error(`메뉴를 등록할 수 없습니다: ${menuError.message}`);
    }
  }

  await supabase.rpc("refresh_store_score_cache", { input_store_id: store.id });

  revalidatePath("/stores");
  revalidatePath("/admin/stores");
  revalidatePath(`/stores/${store.id}`);
  redirect(`/stores/${store.id}`);
}
