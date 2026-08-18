import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  className?: string;
};

export function MetricCard({ label, value, helper, className }: MetricCardProps) {
  return (
    <div className={cn("tt-metric-card", className)}>
      <div className="tt-metric-card__label">{label}</div>
      <div className="tt-metric-card__value">{value}</div>
      {helper ? <p className="tt-metric-card__helper">{helper}</p> : null}
    </div>
  );
}
