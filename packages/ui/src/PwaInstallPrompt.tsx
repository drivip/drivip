import { useState } from "react";
import { cn } from "./utils";
import { usePwaInstall } from "./usePwaInstall";

interface PwaInstallPromptProps {
  appName?: string;
  accent?: "purple" | "emerald" | "blue";
  className?: string;
}

const ACCENTS = {
  purple: {
    icon: "bg-purple-100 text-purple-700",
    button: "bg-purple-700 shadow-purple-700/25",
    border: "border-purple-100",
    soft: "bg-purple-50 text-purple-800",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 shadow-emerald-600/25",
    border: "border-emerald-100",
    soft: "bg-emerald-50 text-emerald-800",
  },
  blue: {
    icon: "bg-blue-100 text-blue-700",
    button: "bg-blue-600 shadow-blue-600/25",
    border: "border-blue-100",
    soft: "bg-blue-50 text-blue-800",
  },
} as const;

export default function PwaInstallPrompt({
  appName = "Drivip",
  accent = "purple",
  className,
}: PwaInstallPromptProps) {
  const { show, isIos, canPrompt, promptInstall, dismiss } = usePwaInstall();
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const theme = ACCENTS[accent];

  if (!show) return null;

  const handleInstall = async () => {
    if (!canPrompt) {
      setHelpOpen((prev) => !prev);
      return;
    }

    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);

    if (outcome === "dismissed") setHelpOpen(true);
    if (outcome === "accepted") setHelpOpen(false);
  };

  const steps = isIos
    ? [
        "Abre esta página en Safari.",
        "Toca el botón Compartir (cuadro con flecha).",
        'Elige "Agregar a pantalla de inicio".',
        'Toca "Agregar" y abre la app desde tu teléfono.',
      ]
    : [
        "Abre esta página en Chrome.",
        "Toca el menú de tres puntos.",
        'Elige "Instalar app" o "Agregar a pantalla de inicio".',
        "Confirma y abre la app desde tu teléfono.",
      ];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-3.5",
        theme.border,
        className,
      )}
      style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", theme.icon)}>
          <span className="material-symbols-outlined text-[22px]">install_mobile</span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-slate-900">Descarga la app de {appName}</p>
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500">
            {isIos
              ? "Abre Drivip como una app en tu iPhone, sin tienda de aplicaciones."
              : "Instálala en tu teléfono para entrar más rápido y recibir avisos."}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-black text-white shadow-md transition active:scale-95 disabled:opacity-60",
                theme.button,
              )}
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              {busy ? "Abriendo..." : "Descargar aquí"}
            </button>
            {!helpOpen && !canPrompt && (
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="rounded-xl px-2.5 py-2 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100"
              >
                Ver cómo
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Ocultar aviso de instalación"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {helpOpen && (
        <div className={cn("mt-3 rounded-xl p-3", theme.soft)}>
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider">
            {isIos ? "En iPhone (Safari)" : "En Android (Chrome)"}
          </p>
          <ol className="space-y-1">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-2 text-[11px] font-medium leading-snug">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/80 text-[9px] font-black">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
