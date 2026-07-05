import { markReportResolvedAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { ReportWithReporter } from "@/lib/types";

type AdminReportTableProps = {
  reports: ReportWithReporter[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function AdminReportTable({ reports }: AdminReportTableProps) {
  if (!reports.length) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No reports are in the queue.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Created</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reporter</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>{formatDate(report.created_at)}</TableCell>
            <TableCell>
              <div className="font-medium">{report.target_type}</div>
              <div className="text-xs text-muted-foreground">{report.target_id}</div>
            </TableCell>
            <TableCell>{report.reason}</TableCell>
            <TableCell>{report.status}</TableCell>
            <TableCell>{report.reporter?.nickname ?? "Unknown"}</TableCell>
            <TableCell>
              {report.status === "resolved" ? null : (
                <form action={markReportResolvedAction}>
                  <input type="hidden" name="report_id" value={report.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Resolve
                  </Button>
                </form>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
