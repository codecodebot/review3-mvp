import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminState } from "@/lib/admin";

export const dynamic = "force-dynamic";

const adminLinks = [
  { href: "/admin/reports", label: "Reports", description: "Review the moderation report queue." },
  { href: "/admin/reviews", label: "Reviews", description: "Hide reviews or exclude them from scoring." },
  { href: "/admin/stores", label: "Stores", description: "Manage verification and ranking limits." }
];

export default async function AdminPage() {
  const { isAdmin } = await getAdminState();

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Sign in with a profile that has <code>is_admin = true</code> to use moderation tools.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Moderation tools for reports, review visibility, scoring exclusion, and store status.
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
                Open
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
