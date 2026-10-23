import { useEffect, useRef, useState } from "react";
import { cn } from "./utils";

interface SplashScreenProps {
  appName?: string;
  subtitle?: string;
  logoSrc?: string;
  ready?: boolean;
  minDuration?: number;
  onFinish?: () => void;
}

export default function SplashScreen({
  appName = "Drivip",
  subtitle,
  logoSrc = "/icon-192.png",
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
        "fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#f4f6f8] transition-all duration-300 ease-out",
        hiding && "pointer-events-none scale-[1.03] opacity-0"
      )}
      aria-label={`Abriendo ${appName}`}
    >
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative flex h-32 w-32 items-center justify-center">
        <span className="drivip-splash-ring absolute inset-0 rounded-[2.2rem] border border-purple-300/60" />
        <div className="drivip-splash-logo relative h-20 w-20 overflow-hidden rounded-[1.6rem] border border-white bg-white shadow-2xl shadow-purple-500/30">
          <img src={logoSrc} alt={appName} className="h-full w-full object-cover" />
        </div>
      </div>

      <h1 className="mt-5 text-xl font-black tracking-tight text-slate-900">{appName}</h1>
      {subtitle && (
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {subtitle}
        </p>
      )}

      <div className="mt-6 h-1 w-28 overflow-hidden rounded-full bg-slate-200">
        <span className="drivip-splash-bar block h-full w-1/2 rounded-full bg-purple-600" />
      </div>
    </div>
  );
}
