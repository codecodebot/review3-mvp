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

function getSafeHost(rawUrl: string) {
  try {
    return new URL(rawUrl).host.replace(/^[^.]+/, "[project]");
  } catch {
    return "invalid-url";
  }
}

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

  const targetHost = getSafeHost(env.url);

  try {
    const restUrl = new URL("/rest/v1/stores?select=id&limit=1", env.url);
    const restResponse = await fetch(restUrl, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`
      },
      cache: "no-store"
    });

    if (!restResponse.ok) {
      const body = await restResponse.text();
      const details = body.slice(0, 300);

      console.error("[supabase:health.rest]", {
        status: restResponse.status,
        statusText: restResponse.statusText,
        targetHost,
        details
      });

      if (restResponse.status === 401 || restResponse.status === 403) {
        return response(
          "auth_error",
          {
            message: "Supabase REST API rejected the configured public key.",
            statusCode: restResponse.status,
            targetHost
          },
          503
        );
      }

      return response(
        "database_error",
        {
          message: "Supabase REST API responded but the stores table check failed.",
          statusCode: restResponse.status,
          targetHost
        },
        503
      );
    }

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
          keyName: env.keyName,
          targetHost
        }
      });
    }

    logSupabaseError("health.stores", error);

    if (isSupabaseConnectionError(error)) {
      return response(
        "connection_error",
        {
          message: getErrorMessage(error),
          code: getSupabaseErrorCode(error) ?? null,
          targetHost
        },
        503
      );
    }

    if (isSupabaseAuthError(error)) {
      return response(
        "auth_error",
        {
          message: getErrorMessage(error),
          code: getSupabaseErrorCode(error) ?? null,
          targetHost
        },
        503
      );
    }

    if (isDatabaseSetupError(error)) {
      return response(
        "database_error",
        {
          message: getErrorMessage(error),
          code: getSupabaseErrorCode(error) ?? null,
          targetHost
        },
        503
      );
    }

    return response(
      "database_error",
      {
        message: getErrorMessage(error),
        code: getSupabaseErrorCode(error) ?? null,
        targetHost
      },
      503
    );
  } catch (error) {
    logSupabaseError("health.connection", error);

    if (isSupabaseConnectionError(error)) {
      return response(
        "connection_error",
        {
          message: getErrorMessage(error),
          targetHost
        },
        503
      );
    }

    return response(
      "database_error",
      {
        message: getErrorMessage(error),
        targetHost
      },
      503
    );
  }
}
