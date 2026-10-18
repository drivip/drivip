"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function Modal({ open, onClose, children, className }: ModalProps) {
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
        "fixed inset-0 z-50 flex items-center justify-center px-4",
        "transition-all duration-200",
        show ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" />
      <div
        className={cn(
          "relative w-full bg-surface-container-low rounded-2xl p-5 shadow-2xl",
          "flex flex-col gap-3",
          "transition-all duration-200",
          show ? "scale-100" : "scale-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
