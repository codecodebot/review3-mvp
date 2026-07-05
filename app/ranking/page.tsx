import { RankingTable } from "@/components/ranking-table";
import { getRankedStores } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const stores = await getRankedStores();

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal">Ranking</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Stores need at least 5 visible reviews to appear here. Ranking combines adjusted score
          with revisit intent and trust score.
        </p>
      </div>
      <RankingTable stores={stores} />
    </div>
  );
}
