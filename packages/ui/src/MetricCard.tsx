import { cn } from "./utils";

type MetricCardProps = {
  label: string;
  value: string;
  suffix?: string;
  trend?: { value: string; positive: boolean };
  icon?: string;
  className?: string;
  compact?: boolean;
};

export default function MetricCard({
  label,
  value,
  suffix,
  trend,
  icon,
  className,
  compact = false,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-container border border-outline-variant/30 shadow-sm",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex items-center justify-between text-on-surface-variant mb-1">
        <span className="text-[11px] uppercase tracking-wider font-mono">
          {label}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-[16px] text-primary">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-[24px] leading-tight text-on-surface font-bold tracking-tight">
          {value}
        </span>
        {suffix && (
          <span className="text-[11px] text-on-surface-variant font-mono">
            {suffix}
          </span>
        )}
      </div>
      {trend && (
        <span
          className={cn(
            "text-[12px] flex items-center gap-0.5 mt-1",
            trend.positive ? "text-secondary" : "text-error"
          )}
        >
          <span className="material-symbols-outlined text-[14px]">
            {trend.positive ? "trending_up" : "trending_down"}
          </span>
          {trend.value}
        </span>
      )}
    </div>
  );
}
