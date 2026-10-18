import { cn } from "@drivip/ui";

type StatusOption = "disponible" | "no_trabajo" | "disponible_15" | "disponible_30";

interface StatusHeroCardProps {
  currentStatus: StatusOption;
  onStatusChange: (status: StatusOption) => void;
  dailyEarnings: number;
  dailyRides: number;
  rating: number;
  onlineTime: string;
}

const STATUS_OPTIONS: { id: StatusOption; label: string; color: string; dot: string; bg: string; activeBg: string }[] = [
  { id: "disponible", label: "Disponible", color: "text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200", activeBg: "bg-emerald-500 text-white" },
  { id: "no_trabajo", label: "Hoy no trabajo", color: "text-red-600", dot: "bg-red-400", bg: "bg-red-50 border-red-200", activeBg: "bg-red-500 text-white" },
  { id: "disponible_15", label: "Disponible en 15 min", color: "text-amber-600", dot: "bg-amber-400", bg: "bg-amber-50 border-amber-200", activeBg: "bg-amber-500 text-white" },
  { id: "disponible_30", label: "Disponible en 30 min", color: "text-amber-500", dot: "bg-amber-300", bg: "bg-amber-50 border-amber-200", activeBg: "bg-amber-400 text-white" },
];

export default function StatusHeroCard({
  currentStatus,
  onStatusChange,
  dailyEarnings,
  dailyRides,
  rating,
  onlineTime,
}: StatusHeroCardProps) {
  return (
    <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm lg:text-base font-black text-slate-900">Estado de Servicio</h2>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] lg:text-xs font-bold bg-white/90 backdrop-blur-md text-purple-900 shadow">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
          En Vivo
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = currentStatus === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onStatusChange(opt.id)}
              className={cn(
                "p-3 rounded-2xl border-2 flex items-center gap-2.5 transition-all active:scale-95",
                isActive
                  ? `${opt.activeBg} border-transparent shadow-lg`
                  : `bg-white border-slate-200 hover:border-slate-300`
              )}
              style={!isActive ? { boxShadow: "3px 3px 8px #d9dde2, -3px -3px 8px #ffffff" } : undefined}
            >
              <span className={cn("w-3 h-3 rounded-full flex-shrink-0", isActive ? "bg-white/80" : opt.dot)} />
              <span className={cn("text-[11px] lg:text-xs font-bold text-left leading-tight", isActive ? "text-white" : "text-slate-700")}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        <div className="flex flex-col items-center">
          <span className="text-lg lg:text-xl font-black text-slate-900">${dailyEarnings > 0 ? dailyEarnings.toFixed(0) : "42"}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Ganancias</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg lg:text-xl font-black text-slate-900">{dailyRides || 8}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Carreras</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg lg:text-xl font-black text-slate-900">{rating}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Rating</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg lg:text-xl font-black text-slate-900">{onlineTime}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">En Ruta</span>
        </div>
      </div>
    </div>
  );
}
