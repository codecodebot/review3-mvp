import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function StoresLoading() {
  return <PageSkeleton variant="stores" message="매장 데이터를 불러오는 중" />;
}
