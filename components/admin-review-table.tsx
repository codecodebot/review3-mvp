import { toggleReviewExcludedAction, toggleReviewHiddenAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { AdminReview } from "@/lib/queries";

type AdminReviewTableProps = {
  reviews: AdminReview[];
};

export function AdminReviewTable({ reviews }: AdminReviewTableProps) {
  if (!reviews.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        리뷰가 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>매장</TableHead>
          <TableHead>리뷰어</TableHead>
          <TableHead>점수</TableHead>
          <TableHead>내용</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell>{review.store?.name ?? "알 수 없는 매장"}</TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <span>{review.profile?.nickname ?? "알 수 없음"}</span>
                {review.is_synthetic || review.profile?.is_synthetic ? (
                  <Badge variant="muted">데모</Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell>{review.review_score?.toFixed(2) ?? "없음"}</TableCell>
            <TableCell className="max-w-xs truncate">{review.review_text ?? "내용 없음"}</TableCell>
            <TableCell>
              <div className="space-y-1 text-xs">
                <div>{review.is_hidden ? "숨김" : "표시"}</div>
                <div>{review.excluded_from_score ? "점수 제외" : "점수 포함"}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <form action={toggleReviewHiddenAction}>
                  <input type="hidden" name="review_id" value={review.id} />
                  <input type="hidden" name="store_id" value={review.store_id} />
                  <input type="hidden" name="user_id" value={review.user_id} />
                  <input
                    type="hidden"
                    name="is_hidden"
                    value={review.is_hidden ? "false" : "true"}
                  />
                  <Button size="sm" variant="outline" type="submit">
                    {review.is_hidden ? "표시" : "숨김"}
                  </Button>
                </form>
                <form action={toggleReviewExcludedAction}>
                  <input type="hidden" name="review_id" value={review.id} />
                  <input type="hidden" name="store_id" value={review.store_id} />
                  <input type="hidden" name="user_id" value={review.user_id} />
                  <input
                    type="hidden"
                    name="excluded_from_score"
                    value={review.excluded_from_score ? "false" : "true"}
                  />
                  <Button size="sm" variant="outline" type="submit">
                    {review.excluded_from_score ? "포함" : "제외"}
                  </Button>
                </form>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
