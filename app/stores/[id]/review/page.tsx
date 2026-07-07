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
          매장으로 돌아가기
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">
          {store.name} 리뷰 작성
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          맛, 서비스, 공간을 따로 평가합니다. 계산된 리뷰 점수가 4.5 이상이면 이유가 필요합니다.
        </p>
      </div>

      <ReviewForm storeId={store.id} />
    </div>
  );
}
