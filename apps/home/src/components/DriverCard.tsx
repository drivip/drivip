import { useState } from "react";

interface DriverCardProps {
  name: string;
  vehicle: string;
  rating: number;
  trips: number;
  verified?: boolean;
  premium?: boolean;
  distance?: string;
  onRequest?: () => void;
}

export default function DriverCard({ name, vehicle, rating, trips, verified = false, premium = false, distance, onRequest }: DriverCardProps) {
  const [requested, setRequested] = useState(false);

  const handleRequest = () => {
    setRequested(true);
    onRequest?.();
    setTimeout(() => setRequested(false), 3000);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center border border-white/20">
            <span className="text-lg font-bold text-white">{name.charAt(0)}</span>
          </div>
          {premium && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-white">star</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-[13px] font-bold text-white truncate">{name}</h4>
            {verified && (
              <span className="material-symbols-outlined text-[14px] text-blue-400">verified</span>
            )}
          </div>
          <span className="text-[11px] text-white/60">{vehicle}</span>
        </div>
        {distance && (
          <span className="text-[10px] text-white/50 font-medium whitespace-nowrap">{distance}</span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`material-symbols-outlined text-[12px] ${s <= Math.round(rating) ? "text-amber-400" : "text-white/20"}`}>star</span>
          ))}
          <span className="text-[11px] font-bold text-white ml-1">{rating}</span>
        </div>
        <span className="text-[10px] text-white/50">{trips} viajes</span>
      </div>

      <div className="flex items-center gap-2">
        {premium && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider border border-amber-500/30">
            Premium
          </span>
        )}
        {verified && (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider border border-blue-500/30">
            Verificado
          </span>
        )}
      </div>

      {!requested ? (
        <button
          onClick={handleRequest}
          className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[12px] font-bold active:scale-[0.98] transition shadow-lg shadow-purple-500/25"
        >
          Solicitar Servicio
        </button>
      ) : (
        <div className="w-full mt-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-[12px] font-bold text-center border border-emerald-500/30">
          ✓ Solicitud Enviada
        </div>
      )}
    </div>
  );
}
