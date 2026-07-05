import Link from "next/link";
import { ScoreBadge } from "@/components/score-badge";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationBadge } from "@/components/verification-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { StoreWithScore } from "@/lib/types";

type RankingTableProps = {
  stores: StoreWithScore[];
};

export function RankingTable({ stores }: RankingTableProps) {
  if (!stores.length) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No stores have enough visible reviews for ranking yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Store</TableHead>
          <TableHead>Scores</TableHead>
          <TableHead>Reviews</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.map((store, index) => (
          <TableRow key={store.id}>
            <TableCell className="font-semibold">{index + 1}</TableCell>
            <TableCell>
              <Link className="font-medium hover:underline" href={`/stores/${store.id}`}>
                {store.name}
              </Link>
              <div className="mt-1 text-xs text-muted-foreground">
                {store.region} · {store.category}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <ScoreBadge label="Adjusted" value={store.score?.adjusted_score} tone="adjusted" />
                <ScoreBadge label="RAW" value={store.score?.raw_score} tone="raw" />
              </div>
            </TableCell>
            <TableCell>{store.score?.review_count ?? 0}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <VerificationBadge status={store.verification_status} />
                <TrustBadge level={store.score?.trust_level} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
