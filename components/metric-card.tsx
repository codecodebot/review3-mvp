import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  className?: string;
};

export function MetricCard({ label, value, helper, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.035)]",
        className
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums tracking-normal text-zinc-950">
        {value}
      </div>
      {helper ? <p className="mt-1 text-sm leading-5 text-zinc-500">{helper}</p> : null}
    </div>
  );
}
