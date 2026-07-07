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
        ? "Supabase 연결 불가. 서버가 Supabase에 연결하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요."
        : "데이터베이스 설정이 필요합니다. 가입 또는 로그인 전에 profiles 테이블을 준비해 주세요."
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

  return user.email?.split("@")[0] ?? "리뷰어";
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

  throw new Error(`프로필 테이블을 확인할 수 없습니다: ${getErrorMessage(error)}`);
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

    throw new Error(`사용자 프로필을 준비할 수 없습니다: ${getErrorMessage(error)}`);
  }
}
