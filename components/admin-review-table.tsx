import { toggleReviewExcludedAction, toggleReviewHiddenAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
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
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No reviews found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Store</TableHead>
          <TableHead>Reviewer</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Text</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell>{review.store?.name ?? "Unknown store"}</TableCell>
            <TableCell>{review.profile?.nickname ?? "Unknown"}</TableCell>
            <TableCell>{review.review_score?.toFixed(2) ?? "N/A"}</TableCell>
            <TableCell className="max-w-xs truncate">{review.review_text ?? "No text"}</TableCell>
            <TableCell>
              <div className="space-y-1 text-xs">
                <div>{review.is_hidden ? "Hidden" : "Visible"}</div>
                <div>{review.excluded_from_score ? "Excluded" : "Included"}</div>
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
                    {review.is_hidden ? "Unhide" : "Hide"}
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
                    {review.excluded_from_score ? "Include" : "Exclude"}
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
