import { BadgeCheck, CircleDashed, ShieldAlert } from "lucide-react";
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
    return "tt-badge--verification-verified";
  }

  if (value === "rejected") {
    return "tt-badge--verification-rejected";
  }

  return "tt-badge--muted";
}

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const value = status ?? "pending";
  const Icon = value === "verified" ? BadgeCheck : value === "rejected" ? ShieldAlert : CircleDashed;

  return (
    <Badge variant="outline" className={cn(verificationClass(value), className)}>
      <Icon aria-hidden="true" />
      {verificationLabel(value)}
    </Badge>
  );
}
