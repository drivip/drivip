import { cn } from "./utils";

type SearchInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-11 pl-10 pr-12 rounded-xl",
          "bg-surface-container text-on-surface",
          "text-[14px]",
          "placeholder-on-surface-variant/50",
          "focus:outline-none focus:bg-surface-container-high focus:ring-1 focus:ring-primary-container focus:ring-offset-0",
          "transition-colors"
        )}
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-mono">
        ⌘K
      </div>
    </div>
  );
}
