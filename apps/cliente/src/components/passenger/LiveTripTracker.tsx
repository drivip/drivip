import { useEffect } from "react";
import type { Carrera } from "@drivip/types";
import { formatearUsd, formatearBs } from "@drivip/types";
import { CarreraChat } from "@drivip/supabase";
import type { Driver } from "../../types/passenger";

interface LiveTripTrackerProps {
  carrera: Carrera;
  driver: Driver;
  tasa?: number | null;
  conductorLocation?: { lat: number; lng: number; bearing: number } | null;
  onCallDriver: () => void;
  onRateTrip: () => void;
  onCancelTrip: () => void;
}

const ESTADO_INFO: Record<Carrera["estado"], { label: string; alert: string; done: boolean }> = {
  pendiente: { label: "Solicitando", alert: "Esperando que el conductor acepte...", done: false },
  aceptada: { label: "En Camino", alert: "El conductor va en camino a tu origen", done: false },
  en_curso: { label: "En Viaje", alert: "Rumbo a tu destino", done: false },
  completada: { label: "Completado", alert: "Llegaste a tu destino", done: true },
  cancelada: { label: "Cancelado", alert: "El viaje fue cancelado", done: false },
};

export default function LiveTripTracker({
  carrera,
  driver,
  tasa,
  conductorLocation,
  onCallDriver,
  onRateTrip,
  onCancelTrip,
}: LiveTripTrackerProps) {
  const info = ESTADO_INFO[carrera.estado];
  const enCurso = carrera.estado === "pendiente" || carrera.estado === "aceptada" || carrera.estado === "en_curso";

  useEffect(() => {
    if (carrera.estado === "completada") {
      const t = setTimeout(() => onRateTrip(), 800);
      return () => clearTimeout(t);
    }
  }, [carrera.estado, onRateTrip]);

  const priceUsd = carrera.precio ?? 0;
  const metodoPago =
    carrera.metodo_pago === "pago_movil" ? "Pago Móvil"
      : carrera.metodo_pago === "transferencia" ? "Transferencia"
        : "Efectivo";

  return (
    <section className="bg-white rounded-3xl p-4 lg:p-6 shadow-xl shadow-slate-200/60 border border-slate-100/90 space-y-3 lg:space-y-4" data-purpose="live-trip-tracker">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${info.done ? "bg-emerald-600" : "bg-indigo-600 animate-pulse"}`}></div>
          <h3 className="text-xs lg:text-sm font-black tracking-wide text-slate-800 uppercase">Seguimiento en Vivo</h3>
        </div>
        <span className="text-[10px] lg:text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">{info.label}</span>
      </div>

      {/* Conductor asignado */}
      <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/50 border border-slate-200 flex items-center gap-3 transition-all">
        <div className="relative flex-shrink-0">
          {driver.image ? (
            <img alt={`Conductor ${driver.name}`} className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl object-cover border-2 border-white shadow-md" src={driver.image} />
          ) : (
            <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl ${driver.color} flex items-center justify-center font-black text-lg shadow-md`}>
              {driver.initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] lg:text-[10px] font-extrabold px-1 rounded-md flex items-center gap-0.5 shadow-sm">
            ★ {driver.rating}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs lg:text-sm font-extrabold text-slate-900 truncate">{driver.name}</h4>
          <p className="text-[11px] lg:text-xs text-slate-600 font-medium">{driver.vehicle} • <strong className="text-slate-900">{driver.plate}</strong></p>
          <div className={`mt-1 flex items-center gap-1.5 text-[11px] lg:text-xs font-bold ${info.done ? "text-emerald-600" : "text-indigo-700"}`}>
            <span className={`w-2 h-2 rounded-full ${info.done ? "bg-emerald-600" : "bg-indigo-600 animate-ping"}`}></span>
            <span>{info.alert}</span>
          </div>
        </div>
      </div>

      {/* Detalle de ruta y precio */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 lg:p-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Origen</span>
            <p className="text-xs lg:text-sm font-bold text-slate-800 truncate">{carrera.origen_direccion || "Punto de origen"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Destino</span>
            <p className="text-xs lg:text-sm font-bold text-slate-800 truncate">{carrera.destino_direccion || "Destino"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px] lg:text-xs text-slate-500">
          <span>{carrera.distancia_km ? `${carrera.distancia_km.toFixed(1)} km` : "—"} • {metodoPago}</span>
          <span className="text-right">
            <span className="font-black text-slate-900">{formatearUsd(priceUsd)}</span>
            <span className="block text-slate-400">{formatearBs(priceUsd, tasa ?? undefined)}</span>
          </span>
        </div>
        {conductorLocation && !info.done && (
          <p className="text-[10px] lg:text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">my_location</span>
            GPS en vivo: {conductorLocation.lat.toFixed(4)}, {conductorLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          className="py-2.5 px-3 lg:py-3 lg:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          href={`tel:${driver.phone}`}
        >
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Llamar
        </a>
        {enCurso ? (
          <button
            className="py-2.5 px-3 lg:py-3 lg:px-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
            onClick={onCancelTrip}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
            Cancelar
          </button>
        ) : (
          <button
            className="py-2.5 px-3 lg:py-3 lg:px-4 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
            onClick={onRateTrip}
          >
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Calificar
          </button>
        )}
      </div>

      {enCurso && (
        <CarreraChat carreraId={carrera.id} rol="cliente" />
      )}
    </section>
  );
}
