import { Badge } from "@/components/ui/badge";

type VerificationBadgeProps = {
  status?: string | null;
};

function verificationLabel(value: string) {
  if (value === "verified") {
    return "인증됨";
  }

  if (value === "rejected") {
    return "거절됨";
  }

  return "확인 중";
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const value = status ?? "pending";
  const variant =
    value === "verified" ? "success" : value === "rejected" ? "destructive" : "secondary";

  return <Badge variant={variant}>{verificationLabel(value)}</Badge>;
}
