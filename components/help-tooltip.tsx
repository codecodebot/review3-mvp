import { cn } from "@/lib/utils";

type HelpTooltipProps = {
  label: string;
  children: string;
  className?: string;
};

export function HelpTooltip({ label, children, className }: HelpTooltipProps) {
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
        aria-label={`${label} 도움말`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M7.9 7.5a2.2 2.2 0 1 1 3.6 1.7c-.9.7-1.4 1.1-1.4 2.2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          <circle cx="10" cy="14.2" r="0.8" fill="currentColor" />
        </svg>
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs leading-5 text-zinc-700 shadow-lg shadow-zinc-950/5 group-hover:block group-focus-within:block">
        {children}
      </span>
    </span>
  );
}
