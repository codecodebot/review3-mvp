import { Badge } from "@/components/ui/badge";

type TrustBadgeProps = {
  level?: string | null;
  trustScore?: number | null;
};

function levelFromScore(score: number | null | undefined) {
  if (typeof score !== "number") {
    return "unknown";
  }

  if (score >= 1.1) {
    return "high";
  }

  if (score >= 0.95) {
    return "medium";
  }

  return "low";
}

export function TrustBadge({ level, trustScore }: TrustBadgeProps) {
  const resolvedLevel = level ?? levelFromScore(trustScore);
  const variant =
    resolvedLevel === "high" ? "success" : resolvedLevel === "low" ? "warning" : "secondary";

  return <Badge variant={variant}>{`Trust: ${resolvedLevel}`}</Badge>;
}
