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
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Review moderation is limited to admin profiles.
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviews = await getRecentReviewsForAdmin();

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal">Reviews</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hide reviews or exclude them from score calculations.
        </p>
      </div>
      <AdminReviewTable reviews={reviews} />
    </div>
  );
}
