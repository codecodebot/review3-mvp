export type SupabaseEnvStatus =
  | {
      ok: true;
      url: string;
      key: string;
      keyName: "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
    }
  | {
      ok: false;
      missing: string[];
      invalid: string[];
      hasUrl: boolean;
      hasAnonKey: boolean;
      hasPublishableKey: boolean;
    };

function cleanEnvValue(value: string | undefined) {
  return value?.trim();
}

function normalizeSupabaseUrl(value: string | undefined) {
  const cleaned = cleanEnvValue(value);

  if (!cleaned) {
    return undefined;
  }

  const markdownMatch = cleaned.match(/^\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  const candidate = markdownMatch?.[2] ?? cleaned;
  const hostedProjectUrl = candidate.match(/https?:\/\/[a-z0-9-]+\.supabase\.co\b/i);

  return hostedProjectUrl?.[0] ?? candidate;
}

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    const isHostedSupabase = url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
    const isLocalSupabase =
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    return isHostedSupabase || isLocalSupabase;
  } catch {
    return false;
  }
}

function isMarkdownLink(value: string) {
  return /^\[.+\]\(.+\)$/.test(value);
}

export function getSupabaseEnv(): SupabaseEnvStatus {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const publishableKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const key = anonKey || publishableKey;
  const invalid = [];

  if (url && (isMarkdownLink(url) || !isValidSupabaseUrl(url))) {
    invalid.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (key && isMarkdownLink(key)) {
    invalid.push(anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (!url || !key || invalid.length > 0) {
    const missing = [];

    if (!url) {
      missing.push("NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!key) {
      missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    }

    return {
      ok: false,
      missing,
      invalid,
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(anonKey),
      hasPublishableKey: Boolean(publishableKey)
    };
  }

  return {
    ok: true,
    url,
    key,
    keyName: anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  };
}
