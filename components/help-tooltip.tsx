import { cn } from "@/lib/utils";

type HelpTooltipProps = {
  label: string;
  children: string;
  className?: string;
};

export function HelpTooltip({ label, children, className }: HelpTooltipProps) {
  return (
    <span className={cn("tt-help-tooltip", className)}>
      <button
        type="button"
        className="tt-help-tooltip__button"
        aria-label={`${label} 도움말`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="tt-help-tooltip__icon"
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
      <span className="tt-help-tooltip__content">
        {children}
      </span>
    </span>
  );
}
