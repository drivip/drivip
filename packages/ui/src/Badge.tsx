import { cn } from "./utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "active" | "overdue" | "warning" | "offline";
  className?: string;
  pulse?: boolean;
};

export default function Badge({
  children,
  variant = "active",
  className,
  pulse = true,
}: BadgeProps) {
  const variants = {
    active: {
      bg: "bg-secondary-container/20",
      text: "text-secondary",
      dot: "bg-secondary",
      border: "border border-secondary/25",
    },
    overdue: {
      bg: "bg-error-container/40",
      text: "text-error",
      dot: "bg-error",
      border: "border border-error/35",
    },
    warning: {
      bg: "bg-tertiary-container/30",
      text: "text-tertiary",
      dot: "bg-tertiary",
      border: "border border-tertiary/25",
    },
    offline: {
      bg: "bg-surface-container-highest/30",
      text: "text-outline",
      dot: "bg-outline",
      border: "border border-outline-variant",
    },
  };

  const v = variants[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "text-[10px] tracking-wide font-bold uppercase",
        v.bg,
        v.text,
        v.border,
        className
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          v.dot,
          pulse && variant === "active" && "animate-ping",
          pulse && variant === "overdue" && "animate-pulse"
        )}
      />
      {children}
    </span>
  );
}
