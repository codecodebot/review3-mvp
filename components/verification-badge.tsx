import { Badge } from "@/components/ui/badge";

type VerificationBadgeProps = {
  status?: string | null;
};

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const value = status ?? "pending";
  const variant =
    value === "verified" ? "success" : value === "rejected" ? "destructive" : "warning";

  return <Badge variant={variant}>{`Verification: ${value}`}</Badge>;
}
