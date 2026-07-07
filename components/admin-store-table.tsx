import { updateStoreModerationAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { StoreWithScore } from "@/lib/types";

type AdminStoreTableProps = {
  stores: StoreWithScore[];
};

export function AdminStoreTable({ stores }: AdminStoreTableProps) {
  if (!stores.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        매장이 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>매장</TableHead>
          <TableHead>점수</TableHead>
          <TableHead>관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.map((store) => (
          <TableRow key={store.id}>
            <TableCell>
              <div className="font-medium">{store.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatRegionLabel(store.region)} / {formatCategoryLabel(store.category)}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                보정 점수 {store.score?.adjusted_score.toFixed(2) ?? "없음"}
              </div>
              <div className="text-xs text-muted-foreground">
                원점수 {store.score?.raw_score.toFixed(2) ?? "없음"} / 리뷰 {store.score?.review_count ?? 0}개
              </div>
            </TableCell>
            <TableCell>
              <form action={updateStoreModerationAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="store_id" value={store.id} />
                <Select
                  name="verification_status"
                  defaultValue={store.verification_status}
                  aria-label="인증 상태"
                  className="w-36"
                >
                  <option value="pending">확인 중</option>
                  <option value="verified">인증됨</option>
                  <option value="rejected">거절됨</option>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                  <Input
                    type="checkbox"
                    name="ranking_limited"
                    defaultChecked={store.ranking_limited}
                    className="h-4 w-4"
                  />
                  랭킹 제한
                </label>
                <Button type="submit" size="sm" variant="outline">
                  저장
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
