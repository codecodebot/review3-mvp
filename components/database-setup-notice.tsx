import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupabaseIssueKind } from "@/lib/setup";

type DatabaseSetupNoticeProps = {
  kind?: SupabaseIssueKind;
};

export function DatabaseSetupNotice({ kind = "database" }: DatabaseSetupNoticeProps) {
  const isConnectionIssue = kind === "connection";

  return (
    <Card className="border-zinc-200/80">
      <CardHeader className="pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          Setup Status
        </p>
        <CardTitle className="mt-2">
          {isConnectionIssue ? "Supabase 연결 불가" : "데이터베이스 설정 필요"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-zinc-600">
        {isConnectionIssue ? (
          <>
            <p>
              Supabase 환경 변수는 설정되어 있지만 서버가 Supabase API에 연결하지 못했습니다.
              로컬 네트워크, Supabase 프로젝트 상태, 개발 서버 재시작 여부를 확인해 주세요.
            </p>
            <p>앱은 중단되지 않고 이 설정 안내를 표시하고 있습니다.</p>
          </>
        ) : (
          <>
            <p>
              Supabase는 설정되어 있지만 MVP 테이블이 아직 준비되지 않았습니다. 마이그레이션을
              적용한 뒤 시드 데이터를 실행해 데모 매장과 리뷰를 채워 주세요.
            </p>
            <p>
              먼저 <code>supabase/migrations/0001_initial_schema.sql</code>을 실행한 뒤{" "}
              필요한 시드 파일을 실행합니다.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
