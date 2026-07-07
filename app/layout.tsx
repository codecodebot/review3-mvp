import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "신뢰 기반 리뷰 MVP",
  description: "원점수와 보정 점수를 함께 보여주는 식당·카페 리뷰입니다."
};

const navItems = [
  { href: "/stores", label: "매장 목록" },
  { href: "/ranking", label: "랭킹" },
  { href: "/admin", label: "관리자" }
];

async function getHeaderUserEmail() {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userEmail = await getHeaderUserEmail();

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-zinc-200 bg-white/95 backdrop-blur">
            <div className="container flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
              <Link href="/" className="text-base font-bold tracking-normal text-zinc-950">
                신뢰리뷰 MVP
              </Link>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <nav className="flex items-center gap-2 text-sm">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-3 py-2 font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                {userEmail ? (
                  <div className="flex items-center gap-3">
                    <span className="max-w-48 truncate text-sm font-medium text-zinc-500">
                      {userEmail}
                    </span>
                    <form action={logoutAction}>
                      <Button type="submit" variant="outline" size="sm">
                        로그아웃
                      </Button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
