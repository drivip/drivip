import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setRender(true);
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!render) return null;

  return (
    <div
      className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 rounded-full text-[13px] sm:text-sm lg:text-base shadow-xl flex items-center gap-2 transition-all duration-300 max-w-[90vw] ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="truncate">{message}</span>
    </div>
  );
}
