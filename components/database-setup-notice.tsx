import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupabaseIssueKind } from "@/lib/setup";

type DatabaseSetupNoticeProps = {
  kind?: SupabaseIssueKind;
};

const NOTICE_COPY: Record<SupabaseIssueKind, { title: string; body: string; detail: string }> = {
  environment: {
    title: "Supabase 환경 변수 필요",
    body: "서버에 Supabase URL 또는 공개 API 키가 등록되어 있지 않습니다.",
    detail:
      "Vercel 환경 변수에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY 또는 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 원본 값 그대로 등록해 주세요."
  },
  connection: {
    title: "Supabase 연결 불가",
    body: "환경 변수는 설정되어 있지만 서버가 Supabase API에 연결하지 못했습니다.",
    detail: "Supabase 프로젝트 상태, 네트워크 접근, Vercel 함수 런타임의 외부 요청 가능 여부를 확인해 주세요."
  },
  auth: {
    title: "Supabase 인증 설정 확인 필요",
    body: "Supabase API에는 도달했지만 공개 API 키 인증이 실패했거나 권한이 부족합니다.",
    detail: "Vercel에 등록된 공개 키가 현재 Supabase 프로젝트의 anon 또는 publishable key인지 확인해 주세요."
  },
  database: {
    title: "데이터베이스 설정 필요",
    body: "Supabase에는 연결되었지만 필요한 테이블, 컬럼, 함수 또는 RLS 설정이 준비되지 않았습니다.",
    detail: "마이그레이션 파일을 순서대로 적용한 뒤 seed와 score refresh를 실행해 주세요."
  }
};

export function DatabaseSetupNotice({ kind = "database" }: DatabaseSetupNoticeProps) {
  const copy = NOTICE_COPY[kind];

  return (
    <Card className="border-zinc-200/80">
      <CardHeader className="pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          설정 상태
        </p>
        <CardTitle className="mt-2">{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-zinc-600">
        <p>{copy.body}</p>
        <p>{copy.detail}</p>
      </CardContent>
    </Card>
  );
}
