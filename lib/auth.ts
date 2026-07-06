import type { User } from "@supabase/supabase-js";
import { isDatabaseSetupError } from "@/lib/setup";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = ReturnType<typeof createClient>;

export class AuthSetupError extends Error {
  constructor() {
    super("Database setup required before auth profiles can be created.");
    this.name = "AuthSetupError";
  }
}

function nicknameFromUser(user: User) {
  const metadataNickname = user.user_metadata.nickname;

  if (typeof metadataNickname === "string" && metadataNickname.trim().length > 0) {
    return metadataNickname.trim();
  }

  return user.email?.split("@")[0] ?? "Reviewer";
}

export async function assertProfilesTableReady(supabase: SupabaseServerClient) {
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (!error) {
    return;
  }

  if (isDatabaseSetupError(error)) {
    throw new AuthSetupError();
  }

  throw new Error(`Unable to check profile table: ${error.message}`);
}

export async function ensureProfileForUser(supabase: SupabaseServerClient, user: User) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      nickname: nicknameFromUser(user)
    },
    { onConflict: "id" }
  );

  if (error) {
    if (isDatabaseSetupError(error)) {
      throw new AuthSetupError();
    }

    throw new Error(`Unable to ensure user profile: ${error.message}`);
  }
}
