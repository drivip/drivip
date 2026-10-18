"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SlideOverProps = {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function SlideOver({
  open,
  onClose,
  children,
  className,
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
        "fixed inset-0 z-50 flex flex-col justify-end",
        "transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" />
      <div
        className={cn(
          "relative w-full bg-surface-container-low rounded-t-2xl max-h-[85vh] flex flex-col p-5 shadow-2xl overflow-hidden",
          "transition-transform duration-300",
          show ? "translate-y-0" : "translate-y-full",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4" />
        {children}
      </div>
    </div>
  );
}
