import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminState } from "@/lib/admin";

export const dynamic = "force-dynamic";

const adminLinks = [
  { href: "/admin/reports", label: "신고", description: "접수된 신고를 확인합니다." },
  { href: "/admin/reviews", label: "리뷰", description: "리뷰 숨김과 점수 제외를 관리합니다." },
  { href: "/admin/stores", label: "매장", description: "인증 상태와 랭킹 제한을 관리합니다." }
];

export default async function AdminPage() {
  const { isAdmin } = await getAdminState();

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>관리자 권한 필요</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            관리 도구를 사용하려면 <code>is_admin = true</code>인 프로필로 로그인해야 합니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">관리자</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          신고, 리뷰 표시, 점수 제외, 매장 상태를 관리합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {adminLinks.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              <Link href={item.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                열기
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
