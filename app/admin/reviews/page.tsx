import { AdminReviewTable } from "@/components/admin-review-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminState } from "@/lib/admin";
import { getRecentReviewsForAdmin } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const { isAdmin } = await getAdminState();

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>관리자 권한 필요</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            리뷰 관리는 관리자 프로필만 사용할 수 있습니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviews = await getRecentReviewsForAdmin();

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">리뷰</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          리뷰를 숨기거나 점수 계산에서 제외합니다.
        </p>
      </div>
      <AdminReviewTable reviews={reviews} />
    </div>
  );
}
