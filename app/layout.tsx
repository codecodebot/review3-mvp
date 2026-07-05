import type { Metadata } from "next";
import Link from "next/link";
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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b bg-card">
            <div className="container flex h-16 items-center justify-between gap-6">
              <Link href="/" className="text-base font-semibold tracking-normal">
                TrustTable MVP
              </Link>
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
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
