import { useEffect, useState } from "react";
import { cn } from "./utils";

type SlideOverProps = {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  width?: string;
};

export default function SlideOver({
  open,
  onClose,
  children,
  className,
  width = "w-[90vw] max-w-[400px]",
}: SlideOverProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        "transition-opacity duration-250 ease-out",
        show ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          "relative h-full bg-surface-container-low shadow-2xl",
          "transition-transform duration-250 ease-out flex flex-col",
          width,
          show ? "translate-x-0" : "-translate-x-full",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      <div className="flex-1" />
    </div>
  );
}
