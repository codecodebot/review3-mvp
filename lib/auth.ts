import type { User } from "@supabase/supabase-js";
import {
  getErrorMessage,
  isDatabaseSetupError,
  isSupabaseConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = ReturnType<typeof createClient>;

export class AuthSetupError extends Error {
  readonly kind: SupabaseIssueKind;

  constructor(kind: SupabaseIssueKind) {
    super(
      kind === "connection"
        ? "Supabase connection unavailable. The server could not reach Supabase; check local network access and retry."
        : "Database setup required before signup or login can create profiles."
    );
    this.name = "AuthSetupError";
    this.kind = kind;
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

  if (isSupabaseConnectionError(error)) {
    throw new AuthSetupError("connection");
  }

  if (isDatabaseSetupError(error)) {
    throw new AuthSetupError("database");
  }

  throw new Error(`Unable to check profile table: ${getErrorMessage(error)}`);
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
    if (isSupabaseConnectionError(error)) {
      throw new AuthSetupError("connection");
    }

    if (isDatabaseSetupError(error)) {
      throw new AuthSetupError("database");
    }

    throw new Error(`Unable to ensure user profile: ${getErrorMessage(error)}`);
  }
}
