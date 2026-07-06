import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Weighted Reviews MVP",
  description: "Restaurant and cafe reviews with RAW and adjusted scores."
};

const navItems = [
  { href: "/stores", label: "Stores" },
  { href: "/ranking", label: "Ranking" },
  { href: "/admin", label: "Admin" }
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
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b bg-card">
            <div className="container flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
              <Link href="/" className="text-base font-semibold tracking-normal">
                TrustTable MVP
              </Link>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <nav className="flex items-center gap-2 text-sm">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                {userEmail ? (
                  <div className="flex items-center gap-3">
                    <span className="max-w-48 truncate text-sm text-muted-foreground">{userEmail}</span>
                    <form action={logoutAction}>
                      <Button type="submit" variant="outline" size="sm">
                        Log out
                      </Button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Log in
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
