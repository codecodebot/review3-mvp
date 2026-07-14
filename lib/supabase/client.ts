"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";
import { getSupabaseEnv } from "@/lib/supabase/env";

type PublicSchema = Database["public"];

export function createClient() {
  const env = getSupabaseEnv();

  if (!env.ok) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  return createBrowserClient<Database, "public", PublicSchema>(env.url, env.key);
}
