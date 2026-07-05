import { StoreCard } from "@/components/store-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { STORE_CATEGORIES, STORE_REGIONS } from "@/lib/constants";
import { getStores } from "@/lib/queries";

export const dynamic = "force-dynamic";

type StoresPageProps = {
  searchParams?: {
    region?: string;
    category?: string;
  };
};

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const stores = await getStores({
    region: searchParams?.region,
    category: searchParams?.category
  });

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Stores</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Filter by region and category. RAW score is never hidden.
          </p>
        </div>
        <form className="grid gap-3 sm:grid-cols-[160px_160px_auto]" action="/stores">
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select id="region" name="region" defaultValue={searchParams?.region ?? "all"}>
              <option value="all">All regions</option>
              {STORE_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={searchParams?.category ?? "all"}>
              <option value="all">All categories</option>
              {STORE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Apply</Button>
        </form>
      </div>

      {stores.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          No stores match the selected filters.
        </div>
      )}
    </div>
  );
}
