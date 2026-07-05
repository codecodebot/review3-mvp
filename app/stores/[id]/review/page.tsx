import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/review-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserId, getStore } from "@/lib/queries";

export const dynamic = "force-dynamic";

type StoreReviewPageProps = {
  params: {
    id: string;
  };
};

export default async function StoreReviewPage({ params }: StoreReviewPageProps) {
  const [store, userId] = await Promise.all([getStore(params.id), getCurrentUserId()]);

  if (!store) {
    notFound();
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Link href={`/stores/${store.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Back to store
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">Review {store.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Score taste, service, and environment separately. A review score of 4.5 or higher
          requires a reason.
        </p>
      </div>

      {userId ? (
        <ReviewForm storeId={store.id} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Supabase Auth is wired for review creation, but this MVP does not include a custom
            login screen yet. Sign in through your app auth flow before submitting reviews.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
