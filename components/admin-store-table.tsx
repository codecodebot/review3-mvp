import { updateStoreModerationAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No stores found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Store</TableHead>
          <TableHead>Scores</TableHead>
          <TableHead>Moderation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.map((store) => (
          <TableRow key={store.id}>
            <TableCell>
              <div className="font-medium">{store.name}</div>
              <div className="text-xs text-muted-foreground">
                {store.region} · {store.category}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">Adjusted {store.score?.adjusted_score.toFixed(2) ?? "N/A"}</div>
              <div className="text-xs text-muted-foreground">
                RAW {store.score?.raw_score.toFixed(2) ?? "N/A"} · {store.score?.review_count ?? 0} reviews
              </div>
            </TableCell>
            <TableCell>
              <form action={updateStoreModerationAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="store_id" value={store.id} />
                <Select
                  name="verification_status"
                  defaultValue={store.verification_status}
                  aria-label="Verification status"
                  className="w-36"
                >
                  <option value="pending">pending</option>
                  <option value="verified">verified</option>
                  <option value="rejected">rejected</option>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                  <Input
                    type="checkbox"
                    name="ranking_limited"
                    defaultChecked={store.ranking_limited}
                    className="h-4 w-4"
                  />
                  Limit ranking
                </label>
                <Button type="submit" size="sm" variant="outline">
                  Save
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
