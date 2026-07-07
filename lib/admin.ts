import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type AdminContext = {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  profile: Profile;
};

export async function getAdminState() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, userId: null, profile: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    userId: user.id,
    profile,
    isAdmin: Boolean(profile?.is_admin)
  };
}

export async function assertAdmin(): Promise<AdminContext> {
  const state = await getAdminState();

  if (!state.userId || !state.profile?.is_admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  return {
    supabase: state.supabase,
    userId: state.userId,
    profile: state.profile
  };
}
