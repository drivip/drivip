import { useEffect, useRef, useState } from "react";
import { cn } from "./utils";

interface SplashScreenProps {
  label?: string;
  logoSrc?: string;
  ready?: boolean;
  minDuration?: number;
  onFinish?: () => void;
}

export default function SplashScreen({
  label,
  logoSrc = "/icon-512.png",
  ready = false,
  minDuration = 1000,
  onFinish,
}: SplashScreenProps) {
  const [elapsed, setElapsed] = useState(false);
  const [hiding, setHiding] = useState(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const timer = window.setTimeout(() => setElapsed(true), minDuration);
    return () => window.clearTimeout(timer);
  }, [minDuration]);

  useEffect(() => {
    if (!elapsed || !ready) return;
    setHiding(true);
    const timer = window.setTimeout(() => onFinishRef.current?.(), 320);
    return () => window.clearTimeout(timer);
  }, [elapsed, ready]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ease-out",
        hiding && "pointer-events-none opacity-0"
      )}
    >
      <img src={logoSrc} alt="" className="drivip-splash-logo h-24 w-24 object-contain" />
      {label && (
        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.35em] text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}
