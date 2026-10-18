import { cn } from "./utils";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled,
  type = "button",
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary-container text-on-primary hover:bg-inverse-primary border border-white/10 shadow-md active:scale-[0.98]",
    secondary:
      "bg-surface-container-high/60 text-on-surface border border-outline hover:bg-surface-container-highest hover:border-white/15",
    destructive:
      "bg-error/12 text-error border border-error/30 hover:bg-error hover:text-white",
    ghost:
      "bg-transparent text-outline hover:text-on-surface hover:bg-surface-container-high",
    outline:
      "bg-transparent text-on-surface border border-outline hover:bg-surface-container-high hover:border-white/15",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-[11px]",
    md: "px-3 py-2 text-[13px]",
    lg: "px-4 py-2.5 text-[14px]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
