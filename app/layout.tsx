import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trusttable",
  description: "RAW Score와 TT Index를 함께 보여주는 리뷰 신뢰 분석 대시보드입니다.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png"
  }
};

const navItems = [
  { href: "/stores", label: "매장 목록" },
  { href: "/ranking", label: "랭킹" },
  { href: "/tt-index", label: "TT Index란?" },
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
        <div className="tt-app-shell">
          <header className="tt-header">
            <div className="tt-container tt-header__inner">
              <Link href="/" className="tt-brand" aria-label="Trusttable 홈">
                <Image
                  src="/brand/trusttable-logo.png"
                  alt="Trusttable"
                  width={160}
                  height={160}
                  priority
                  className="tt-brand__image"
                />
              </Link>
              <div className="tt-header__actions">
                <nav className="tt-nav" aria-label="주요 메뉴">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="tt-nav__link"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                {userEmail ? (
                  <div className="tt-header__actions">
                    <span className="tt-header__user">{userEmail}</span>
                    <form action={logoutAction}>
                      <Button type="submit" variant="outline" size="sm">
                        로그아웃
                      </Button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
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
