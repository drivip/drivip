import { cn } from "./utils";

type ToggleSwitchProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  className,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-all duration-200 focus:outline-none shrink-0",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked
          ? "bg-primary-container shadow-[0_0_12px_rgba(124,58,237,0.3)]"
          : "bg-surface-variant",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-200",
          checked
            ? "bg-on-primary translate-x-6"
            : "bg-outline translate-x-0"
        )}
      />
    </button>
  );
}
