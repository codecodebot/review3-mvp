export type SupabaseIssueKind = "environment" | "connection" | "auth" | "database";

type SupabaseErrorLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  name?: unknown;
};

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return String(error);
}

function getErrorField(error: unknown, field: keyof SupabaseErrorLike) {
  if (typeof error === "object" && error !== null && field in error) {
    const value = (error as SupabaseErrorLike)[field];
    return typeof value === "string" ? value : undefined;
  }

  return undefined;
}

export function getSupabaseErrorCode(error: unknown) {
  return getErrorField(error, "code");
}

export function isSupabaseEnvironmentError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return message.includes("missing supabase") && message.includes("environment variables");
}

export function isSupabaseConnectionError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network error") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("etimedout")
  );
}

export function isSupabaseAuthError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  const code = getSupabaseErrorCode(error)?.toLowerCase();

  return (
    code === "401" ||
    code === "403" ||
    code === "pgrst301" ||
    message.includes("invalid api key") ||
    message.includes("jwt") ||
    message.includes("permission denied")
  );
}

export function isDatabaseSetupError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  const code = getSupabaseErrorCode(error)?.toLowerCase();

  return (
    code === "42p01" ||
    code === "42883" ||
    code === "42703" ||
    message.includes("could not find the table") ||
    message.includes("could not find the function") ||
    message.includes("schema cache") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

export function isSupabaseSetupOrConnectionError(error: unknown) {
  return (
    isSupabaseEnvironmentError(error) ||
    isSupabaseConnectionError(error) ||
    isSupabaseAuthError(error) ||
    isDatabaseSetupError(error)
  );
}

export function getSupabaseIssueKind(error: unknown): SupabaseIssueKind {
  if (isSupabaseEnvironmentError(error)) {
    return "environment";
  }

  if (isSupabaseConnectionError(error)) {
    return "connection";
  }

  if (isSupabaseAuthError(error)) {
    return "auth";
  }

  return "database";
}

export function logSupabaseError(scope: string, error: unknown) {
  const safeError = {
    message: getErrorMessage(error),
    code: getErrorField(error, "code") ?? null,
    details: getErrorField(error, "details") ?? null,
    hint: getErrorField(error, "hint") ?? null,
    name: getErrorField(error, "name") ?? null
  };

  console.error(`[supabase:${scope}]`, safeError);
}
