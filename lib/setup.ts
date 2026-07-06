export type SupabaseIssueKind = "connection" | "database";

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

export function isDatabaseSetupError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("could not find the table") ||
    message.includes("could not find the function") ||
    message.includes("schema cache") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

export function isSupabaseSetupOrConnectionError(error: unknown) {
  return isSupabaseConnectionError(error) || isDatabaseSetupError(error);
}

export function getSupabaseIssueKind(error: unknown): SupabaseIssueKind {
  return isSupabaseConnectionError(error) ? "connection" : "database";
}
