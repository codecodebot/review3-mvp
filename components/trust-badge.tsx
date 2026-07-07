import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TrustBadgeProps = {
  level?: string | null;
  trustScore?: number | null;
  className?: string;
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

function trustLabel(level: string) {
  if (level === "high") {
    return "신뢰도 높음";
  }

  if (level === "medium") {
    return "신뢰도 보통";
  }

  if (level === "low") {
    return "신뢰도 낮음";
  }

  return "신뢰도 미확인";
}

function trustClass(level: string) {
  if (level === "high") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (level === "low") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (level === "medium") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

export function TrustBadge({ level, trustScore, className }: TrustBadgeProps) {
  const resolvedLevel = level ?? levelFromScore(trustScore);

  return (
    <Badge variant="outline" className={cn(trustClass(resolvedLevel), className)}>
      {trustLabel(resolvedLevel)}
    </Badge>
  );
}
