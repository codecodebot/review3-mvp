import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types";
import {
  getErrorMessage,
  getSupabaseErrorCode,
  isDatabaseSetupError,
  isSupabaseAuthError,
  isSupabaseConnectionError,
  logSupabaseError
} from "@/lib/setup";

type HealthStatus = "ok" | "environment_error" | "connection_error" | "auth_error" | "database_error";

export const dynamic = "force-dynamic";

function response(status: HealthStatus, init?: Record<string, unknown>, httpStatus = 200) {
  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      ...init
    },
    { status: httpStatus }
  );
}

export async function GET() {
  const env = getSupabaseEnv();

  if (!env.ok) {
    return response(
      "environment_error",
      {
        missing: env.missing,
        invalid: env.invalid,
        hasUrl: env.hasUrl,
        hasAnonKey: env.hasAnonKey,
        hasPublishableKey: env.hasPublishableKey
      },
      503
    );
  }

  try {
    const supabase = createClient<Database>(env.url, env.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const { error } = await supabase.from("stores").select("id").limit(1);

    if (!error) {
      return response("ok", {
        env: {
          hasUrl: true,
          keyName: env.keyName
        }
      });
    }

    logSupabaseError("health.stores", error);

    if (isSupabaseConnectionError(error)) {
      return response(
        "connection_error",
        {
          message: getErrorMessage(error),
          code: getSupabaseErrorCode(error) ?? null
        },
        503
      );
    }

    if (isSupabaseAuthError(error)) {
      return response(
        "auth_error",
        {
          message: getErrorMessage(error),
          code: getSupabaseErrorCode(error) ?? null
        },
        503
      );
    }

    if (isDatabaseSetupError(error)) {
      return response(
        "database_error",
        {
          message: getErrorMessage(error),
          code: getSupabaseErrorCode(error) ?? null
        },
        503
      );
    }

    return response(
      "database_error",
      {
        message: getErrorMessage(error),
        code: getSupabaseErrorCode(error) ?? null
      },
      503
    );
  } catch (error) {
    logSupabaseError("health.connection", error);

    if (isSupabaseConnectionError(error)) {
      return response(
        "connection_error",
        {
          message: getErrorMessage(error)
        },
        503
      );
    }

    return response(
      "database_error",
      {
        message: getErrorMessage(error)
      },
      503
    );
  }
}
