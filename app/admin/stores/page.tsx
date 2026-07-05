import { AdminStoreTable } from "@/components/admin-store-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminState } from "@/lib/admin";
import { getAdminStores } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const { isAdmin } = await getAdminState();

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Store moderation is limited to admin profiles.
          </CardContent>
        </Card>
      </div>
    );
  }

  const stores = await getAdminStores();

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal">Stores</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update verification status and ranking limits.
        </p>
      </div>
      <AdminStoreTable stores={stores} />
    </div>
  );
}
