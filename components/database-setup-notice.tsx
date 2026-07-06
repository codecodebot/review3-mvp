import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DatabaseSetupNotice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database setup required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          Supabase is configured, but the MVP tables are not available yet or the local server
          cannot reach Supabase. Apply the migration, then run the seed data to populate the
          demo stores and reviews.
        </p>
        <p>
          Use <code>supabase/migrations/0001_initial_schema.sql</code> first, then{" "}
          <code>supabase/seed.sql</code>.
        </p>
      </CardContent>
    </Card>
  );
}
