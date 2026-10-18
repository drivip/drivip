import { cn } from "./utils";

type ProgressBarProps = {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "secondary" | "error";
};

export default function ProgressBar({
  value,
  max = 100,
  className,
  color = "primary",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    primary: "bg-primary-container",
    secondary: "bg-secondary",
    error: "bg-error",
  };

  return (
    <div
      className={cn(
        "w-full h-2 rounded-full bg-surface-container-highest overflow-hidden",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", colors[color])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
