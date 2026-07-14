import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/types";
import { getSupabaseEnv } from "@/lib/supabase/env";

type PublicSchema = Database["public"];

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function createClient() {
  const cookieStore = cookies();
  const env = getSupabaseEnv();

  if (!env.ok) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createServerClient<Database, "public", PublicSchema>(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Middleware or server actions can.
        }
      }
    }
  });
}
