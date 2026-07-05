import { AdminReportTable } from "@/components/admin-report-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminState } from "@/lib/admin";
import { getReports } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const { isAdmin } = await getAdminState();

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Report moderation is limited to admin profiles.
          </CardContent>
        </Card>
      </div>
    );
  }

  const reports = await getReports();

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">Resolve submitted report records.</p>
      </div>
      <AdminReportTable reports={reports} />
    </div>
  );
}
