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
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function targetTypeLabel(value: string) {
  if (value === "review") {
    return "리뷰";
  }

  if (value === "store") {
    return "매장";
  }

  if (value === "profile") {
    return "프로필";
  }

  return value;
}

export function AdminReportTable({ reports }: AdminReportTableProps) {
  if (!reports.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        처리할 신고가 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>생성일</TableHead>
          <TableHead>대상</TableHead>
          <TableHead>사유</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>신고자</TableHead>
          <TableHead>작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>{formatDate(report.created_at)}</TableCell>
            <TableCell>
              <div className="font-medium">{targetTypeLabel(report.target_type)}</div>
              <div className="text-xs text-muted-foreground">{report.target_id}</div>
            </TableCell>
            <TableCell>{report.reason}</TableCell>
            <TableCell>{report.status === "resolved" ? "처리됨" : "대기 중"}</TableCell>
            <TableCell>{report.reporter?.nickname ?? "알 수 없음"}</TableCell>
            <TableCell>
              {report.status === "resolved" ? null : (
                <form action={markReportResolvedAction}>
                  <input type="hidden" name="report_id" value={report.id} />
                  <Button type="submit" size="sm" variant="outline">
                    처리
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
