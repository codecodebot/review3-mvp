"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

type PublicSchema = Database["public"];

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  return createBrowserClient<Database, "public", PublicSchema>(url, anonKey);
}
