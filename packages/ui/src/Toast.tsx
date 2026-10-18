import { useEffect, useState } from "react";
import { cn } from "./utils";

type ToastProps = {
  message: string;
  visible: boolean;
  icon?: string;
  variant?: "success" | "error" | "info";
  duration?: number;
  onDismiss?: () => void;
};

export default function Toast({
  message,
  visible,
  icon = "check_circle",
  variant = "success",
  duration = 2800,
  onDismiss,
}: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onDismiss?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration, onDismiss]);

  const iconColor =
    variant === "error"
      ? "text-error"
      : variant === "info"
        ? "text-primary"
        : "text-secondary";

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "px-4 py-2.5 rounded-xl",
        "bg-surface-container-highest text-on-surface",
        "flex items-center gap-2 shadow-xl",
        "text-[13px]",
        "transition-all duration-300",
        show
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
    >
      <span className={cn("material-symbols-outlined text-[18px]", iconColor)}>
        {icon}
      </span>
      <span>{message}</span>
    </div>
  );
}
