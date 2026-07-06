export function isDatabaseSetupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Could not find the table") ||
    message.includes("Could not find the function") ||
    message.includes("schema cache") ||
    message.includes("fetch failed") ||
    message.includes("Failed to fetch") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}
