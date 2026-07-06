import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { ReviewForm } from "@/components/review-form";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId, getStore } from "@/lib/queries";
import {
  getSupabaseIssueKind,
  isSupabaseSetupOrConnectionError,
  type SupabaseIssueKind
} from "@/lib/setup";
import type { StoreWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

type StoreReviewPageProps = {
  params: {
    id: string;
  };
};

export default async function StoreReviewPage({ params }: StoreReviewPageProps) {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect(`/login?returnTo=/stores/${params.id}/review`);
  }

  let store: StoreWithScore | null = null;
  let supabaseIssue: SupabaseIssueKind | null = null;

  try {
    store = await getStore(params.id);
  } catch (error) {
    if (!isSupabaseSetupOrConnectionError(error)) {
      throw error;
    }

    supabaseIssue = getSupabaseIssueKind(error);
  }

  if (supabaseIssue) {
    return (
      <div className="container py-8">
        <DatabaseSetupNotice kind={supabaseIssue} />
      </div>
    );
  }

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

      <ReviewForm storeId={store.id} />
    </div>
  );
}
