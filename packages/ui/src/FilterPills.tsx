import { cn } from "./utils";

type FilterOption = {
  id: string;
  label: string;
  count?: number;
};

type FilterPillsProps = {
  options: FilterOption[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
};

export default function FilterPills({
  options,
  activeId,
  onChange,
  className,
}: FilterPillsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            onClick={() => onChange?.(opt.id)}
            className={cn(
              "px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
              "text-[11px] font-medium font-mono",
              isActive
                ? "bg-primary-container text-on-primary shadow-sm"
                : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
            )}
          >
            {opt.label}
            {opt.count !== undefined && ` (${opt.count})`}
          </button>
        );
      })}
    </div>
  );
}
