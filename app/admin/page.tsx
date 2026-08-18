import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminState } from "@/lib/admin";

export const dynamic = "force-dynamic";

const adminLinks = [
  { href: "/admin/reports", label: "신고", description: "접수된 신고를 확인합니다." },
  { href: "/admin/reviews", label: "리뷰", description: "리뷰 숨김과 점수 제외를 관리합니다." },
  { href: "/admin/stores", label: "매장", description: "인증 상태와 랭킹 제한을 관리합니다." },
  { href: "/admin/stores/new", label: "매장 등록", description: "실제 매장 위치와 대표 메뉴를 등록합니다." }
];

export default async function AdminPage() {
  const { isAdmin } = await getAdminState();

  if (!isAdmin) {
    return (
      <div className="tt-page-narrow tt-page">
        <Card>
          <CardHeader>
            <CardTitle>관리자 권한 필요</CardTitle>
          </CardHeader>
          <CardContent>
            관리 도구를 사용하려면 <code>is_admin = true</code>인 프로필로 로그인해야 합니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="tt-container tt-page">
      <div className="tt-page-hero">
        <p className="tt-kicker">Dashboard</p>
        <h1 className="tt-page-title">관리자</h1>
        <p className="tt-lede">
          신고, 리뷰 표시, 점수 제외, 매장 상태를 관리합니다.
        </p>
      </div>
      <div className="tt-admin-grid">
        {adminLinks.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{item.description}</p>
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
