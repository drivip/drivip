import { useEffect, useMemo, useState } from "react";
import type { DisponibilidadConductor } from "@drivip/types";
import { cn } from "@drivip/ui";

interface StatusHeroCardProps {
  estado: DisponibilidadConductor;
  nota?: string | null;
  hasta?: string | null;
  guardando?: boolean;
  isPaused?: boolean;
  syncError?: string | null;
  onChange: (estado: DisponibilidadConductor, nota?: string | null) => void;
  dailyEarnings: number;
  dailyRides: number;
  rating: number;
  totalResenas: number;
  onOpenReviews: () => void;
}

const STATUS_OPTIONS: {
  id: DisponibilidadConductor;
  label: string;
  short: string;
  icon: string;
  active: string;
  dot: string;
}[] = [
  {
    id: "disponible",
    label: "Disponible",
    short: "Recibiendo solicitudes",
    icon: "bolt",
    active: "from-emerald-500 to-teal-600",
    dot: "bg-emerald-500",
  },
  {
    id: "ocupado",
    label: "Ocupado",
    short: "No recibir solicitudes",
    icon: "do_not_disturb_on",
    active: "from-rose-500 to-red-600",
    dot: "bg-rose-500",
  },
  {
    id: "pausa_30",
    label: "Me desocupo en 30 min",
    short: "Pausa breve",
    icon: "schedule",
    active: "from-amber-500 to-orange-600",
    dot: "bg-amber-500",
  },
  {
    id: "personalizado",
    label: "Personalizado",
    short: "Escribe tu estado",
    icon: "edit_note",
    active: "from-indigo-600 to-purple-700",
    dot: "bg-indigo-500",
  },
];

function tiempoRestante(hasta?: string | null): string | null {
  if (!hasta) return null;
  const diff = new Date(hasta).getTime() - Date.now();
  if (diff <= 0) return "Disponible ahora";
  const minutos = Math.ceil(diff / 60000);
  if (minutos < 60) return `Vuelve en ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `Vuelve en ${horas}h ${minutos % 60}m`;
}

export default function StatusHeroCard({
  estado,
  nota,
  hasta,
  guardando,
  isPaused,
  syncError,
  onChange,
  dailyEarnings,
  dailyRides,
  rating,
  totalResenas,
  onOpenReviews,
}: StatusHeroCardProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customNote, setCustomNote] = useState(nota ?? "");
  const [, setTick] = useState(0);

  useEffect(() => {
    setCustomNote(nota ?? "");
  }, [nota]);

  useEffect(() => {
    if (estado !== "pausa_30") return;
    const timer = setInterval(() => setTick((value) => value + 1), 30000);
    return () => clearInterval(timer);
  }, [estado]);

  const actual = STATUS_OPTIONS.find((option) => option.id === estado) ?? STATUS_OPTIONS[0];
  const countdown = useMemo(() => tiempoRestante(hasta), [hasta, estado]);

  const handleSelect = (nuevo: DisponibilidadConductor) => {
    if (isPaused) return;
    if (nuevo === "personalizado") {
      setCustomOpen(true);
      if (estado === "personalizado" && nota) setCustomNote(nota);
      return;
    }
    setCustomOpen(false);
    onChange(nuevo, null);
  };

  const guardarPersonalizado = () => {
    const texto = customNote.trim();
    if (!texto) return;
    onChange("personalizado", texto);
    setCustomOpen(false);
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60">
      <div className={cn("relative bg-gradient-to-br p-4 text-white sm:p-5", actual.active)}>
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
              Estado de servicio
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {estado === "disponible" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                )}
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              <h2 className="text-xl font-black leading-tight">{actual.label}</h2>
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-white/75">
              {isPaused
                ? "Cuenta pausada por el administrador"
                : estado === "personalizado"
                  ? nota || "Estado personalizado"
                  : estado === "pausa_30"
                    ? countdown ?? actual.short
                    : actual.short}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide backdrop-blur-sm">
              {guardando ? "Guardando..." : isPaused ? "Pausado" : "En línea"}
            </span>
            <span className="material-symbols-outlined text-[32px] text-white/85">{actual.icon}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((option) => {
            const activo = estado === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={isPaused}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left transition active:scale-[0.97] disabled:opacity-50",
                  activo
                    ? "border-transparent bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    activo ? "bg-emerald-400" : option.dot
                  )}
                />
                <span className="text-[11px] font-bold leading-tight">{option.label}</span>
              </button>
            );
          })}
        </div>

        {syncError && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="material-symbols-outlined mt-0.5 text-[16px] text-amber-600">
              cloud_off
            </span>
            <p className="text-[10px] font-semibold leading-snug text-amber-700">{syncError}</p>
          </div>
        )}

        {customOpen && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
            <label className="text-[10px] font-black uppercase tracking-wide text-indigo-700">
              ¿Qué quieres mostrar a tus clientes?
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={customNote}
                onChange={(event) => setCustomNote(event.target.value.slice(0, 80))}
                placeholder="Ej: Almorzando, vuelvo en 20 min"
                className="h-10 min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={guardarPersonalizado}
                disabled={!customNote.trim() || guardando}
                className="h-10 rounded-xl bg-indigo-600 px-3 text-[11px] font-black text-white active:scale-95 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3">
          <div className="text-center">
            <p className="text-base font-black text-slate-900">${dailyEarnings.toFixed(2)}</p>
            <p className="text-[9px] font-semibold text-slate-500">Hoy</p>
          </div>
          <div className="text-center">
            <p className="text-base font-black text-slate-900">{dailyRides}</p>
            <p className="text-[9px] font-semibold text-slate-500">Servicios</p>
          </div>
          <button type="button" onClick={onOpenReviews} className="text-center active:scale-95">
            <p className="text-base font-black text-slate-900">
              {rating > 0 ? rating.toFixed(1) : "-"}
            </p>
            <p className="text-[9px] font-semibold text-purple-600">
              {totalResenas > 0 ? `${totalResenas} reseñas` : "Sin reseñas"}
            </p>
          </button>
          <div className="text-center">
            <p className="text-base font-black text-slate-900">
              {estado === "disponible" ? "Sí" : "No"}
            </p>
            <p className="text-[9px] font-semibold text-slate-500">Recibiendo</p>
          </div>
        </div>
      </div>
    </section>
  );
}
