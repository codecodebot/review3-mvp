import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type VerificationBadgeProps = {
  status?: string | null;
  className?: string;
};

function verificationLabel(value: string) {
  if (value === "verified") {
    return "매장 인증됨";
  }

  if (value === "rejected") {
    return "인증 거절";
  }

  return "인증 확인 중";
}

function verificationClass(value: string) {
  if (value === "verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (value === "rejected") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const value = status ?? "pending";

  return (
    <Badge variant="outline" className={cn(verificationClass(value), className)}>
      {verificationLabel(value)}
    </Badge>
  );
}
