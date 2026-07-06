"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthSetupError, assertProfilesTableReady, ensureProfileForUser } from "@/lib/auth";
import { getErrorMessage } from "@/lib/setup";
import { createClient } from "@/lib/supabase/server";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeReturnTo(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/stores";
}

function loginRedirect(params: { error?: string; message?: string; returnTo?: string }): never {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.message) {
    searchParams.set("message", params.message);
  }

  if (params.returnTo) {
    searchParams.set("returnTo", params.returnTo);
  }

  redirect(`/login?${searchParams.toString()}`);
}

function authErrorMessage(error: unknown) {
  if (error instanceof AuthSetupError) {
    return error.message;
  }

  if (error instanceof Error) {
    return getErrorMessage(error);
  }

  return "Authentication failed.";
}

export async function loginAction(formData: FormData) {
  const supabase = createClient();
  const email = stringValue(formData, "email");
  const password = stringValue(formData, "password");
  const returnTo = safeReturnTo(stringValue(formData, "return_to"));

  if (!email || !password) {
    loginRedirect({ error: "Email and password are required.", returnTo });
  }

  try {
    await assertProfilesTableReady(supabase);
  } catch (error) {
    loginRedirect({ error: authErrorMessage(error), returnTo });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    loginRedirect({ error: error?.message ?? "Unable to log in.", returnTo });
  }

  try {
    await ensureProfileForUser(supabase, data.user);
  } catch (error) {
    loginRedirect({ error: authErrorMessage(error), returnTo });
  }

  revalidatePath("/", "layout");
  redirect(returnTo);
}

export async function signupAction(formData: FormData) {
  const supabase = createClient();
  const email = stringValue(formData, "email");
  const password = stringValue(formData, "password");
  const nickname = stringValue(formData, "nickname");
  const returnTo = safeReturnTo(stringValue(formData, "return_to"));

  if (!email || !password) {
    loginRedirect({ error: "Email and password are required.", returnTo });
  }

  if (password.length < 6) {
    loginRedirect({ error: "Password must be at least 6 characters.", returnTo });
  }

  try {
    await assertProfilesTableReady(supabase);
  } catch (error) {
    loginRedirect({ error: authErrorMessage(error), returnTo });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: nickname ? { nickname } : undefined
    }
  });

  if (error || !data.user) {
    loginRedirect({ error: error?.message ?? "Unable to sign up.", returnTo });
  }

  if (!data.session) {
    loginRedirect({
      message: "Signup created. Check your email before logging in.",
      returnTo
    });
  }

  try {
    await ensureProfileForUser(supabase, data.user);
  } catch (error) {
    loginRedirect({ error: authErrorMessage(error), returnTo });
  }

  revalidatePath("/", "layout");
  redirect(returnTo);
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
