import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupabaseIssueKind } from "@/lib/setup";

type DatabaseSetupNoticeProps = {
  kind?: SupabaseIssueKind;
};

export function DatabaseSetupNotice({ kind = "database" }: DatabaseSetupNoticeProps) {
  const isConnectionIssue = kind === "connection";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isConnectionIssue ? "Supabase connection unavailable" : "Database setup required"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {isConnectionIssue ? (
          <>
            <p>
              Supabase environment variables are configured, but this server could not reach the
              Supabase API. Check local network access, confirm the Supabase project is online, and
              restart the development server after environment changes.
            </p>
            <p>The app is showing this setup state instead of crashing.</p>
          </>
        ) : (
          <>
            <p>
              Supabase is configured, but the MVP tables are not available yet. Apply the migration,
              then run the seed data to populate the demo stores and reviews.
            </p>
            <p>
              Use <code>supabase/migrations/0001_initial_schema.sql</code> first, then{" "}
              <code>supabase/seed.sql</code>.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
