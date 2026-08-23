import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, BookOpenText, Building2, LogIn } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";
import "./report-ui.css";

export const metadata: Metadata = {
  title: "Trusttable",
  description: "RAW Score와 TT Index를 함께 보여주는 리뷰 신뢰 분석 대시보드입니다.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png"
  }
};

const navItems = [
  { href: "/stores", label: "매장 탐색", icon: Building2 },
  { href: "/ranking", label: "랭킹", icon: BarChart3 },
  { href: "/tt-index", label: "TT Index", icon: BookOpenText }
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
                <BrandMark />
              </Link>
              <div className="tt-header__actions">
                <nav className="tt-nav tt-nav--desktop" aria-label="주요 메뉴">
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
                    <LogIn className="tt-icon-sm" aria-hidden="true" /> 로그인
                  </Link>
                )}
              </div>
            </div>
          </header>
          <main>{children}</main>
          <nav className="tt-mobile-nav" aria-label="모바일 주요 메뉴">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href} className="tt-mobile-nav__item">
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link href="/login" className="tt-mobile-nav__item">
              <LogIn aria-hidden="true" />
              <span>계정</span>
            </Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
