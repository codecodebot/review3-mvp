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

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isMarkdownLink(value: string) {
  return /^\[.+\]\(.+\)$/.test(value);
}

export function getSupabaseEnv(): SupabaseEnvStatus {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
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
