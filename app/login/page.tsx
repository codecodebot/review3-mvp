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
    return "Supabase 연결 불가. 서버가 Supabase에 연결하지 못했습니다. 네트워크와 프로젝트 상태를 확인해 주세요.";
  }

  if (isDatabaseSetupError(error)) {
    return "데이터베이스 설정이 필요합니다. 가입 또는 로그인 전에 profiles 테이블을 준비해 주세요.";
  }

  if (/^[\x00-\x7F]+$/.test(error)) {
    return "인증 처리 중 오류가 발생했습니다. 입력값과 계정 상태를 확인해 주세요.";
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
          홈으로
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">로그인</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          이메일과 비밀번호로 로그인해 리뷰를 작성하고 계정을 사용할 수 있습니다.
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
            <CardTitle>로그인</CardTitle>
            <CardDescription>기존 계정으로 계속합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="space-y-2">
                <Label htmlFor="login-email">이메일</Label>
                <Input id="login-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">비밀번호</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                로그인
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>가입</CardTitle>
            <CardDescription>계정과 프로필을 함께 만듭니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signupAction} className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="space-y-2">
                <Label htmlFor="signup-nickname">닉네임</Label>
                <Input id="signup-nickname" name="nickname" autoComplete="nickname" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일</Label>
                <Input id="signup-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">비밀번호</Label>
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
                가입하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
