import Link from "next/link";
import { StoreRegistrationForm } from "@/components/store-registration-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminState } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewStorePage() {
  const { isAdmin } = await getAdminState();

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>관리자 권한 필요</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            실제 매장 등록은 관리자 프로필만 사용할 수 있습니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Store Registry</p>
          <h1 className="mt-3 text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">
            실제 매장 등록
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            위치와 대표 메뉴를 함께 등록합니다. 등록된 매장은 기존 가상 매장과 같은 리뷰/점수 기능을 사용합니다.
          </p>
        </div>
        <Link href="/admin/stores" className={buttonVariants({ variant: "outline", size: "sm" })}>
          매장 관리로 돌아가기
        </Link>
      </div>
      <StoreRegistrationForm />
    </div>
  );
}
