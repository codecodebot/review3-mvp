import Link from "next/link";
import { loginAction, signupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDatabaseSetupError, isSupabaseConnectionError } from "@/lib/setup";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
    returnTo?: string;
  };
};

function safeReturnTo(value: string | undefined) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/stores";
}

function displayAuthError(error: string | undefined) {
  if (!error) {
    return null;
  }

  if (isSupabaseConnectionError(error)) {
    return "Supabase connection unavailable. The server could not reach Supabase; check local network access and retry.";
  }

  if (isDatabaseSetupError(error)) {
    return "Database setup required before signup or login can create profiles.";
  }

  return error;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const returnTo = safeReturnTo(searchParams?.returnTo);
  const errorMessage = displayAuthError(searchParams?.error);

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Back home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use email and password auth to write reviews and access your account.
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      {searchParams?.message ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {searchParams.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Return to the app with an existing account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Log in
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>Create an account and matching profile row.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signupAction} className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="space-y-2">
                <Label htmlFor="signup-nickname">Nickname</Label>
                <Input id="signup-nickname" name="nickname" autoComplete="nickname" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
