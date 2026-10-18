import { useState } from "react";
import type { Driver } from "../../types/passenger";

interface LiveTripTrackerProps {
  driver: Driver;
  onCallDriver: () => void;
  onRateTrip: () => void;
}

export default function LiveTripTracker({ driver, onCallDriver, onRateTrip }: LiveTripTrackerProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [etaText, setEtaText] = useState("ETA 4 min");
  const [alertText, setAlertText] = useState("Auto aproximándose en mapa");
  const [isArrived, setIsArrived] = useState(false);

  const handleStep = (step: number) => {
    setActiveStep(step);
    setIsArrived(false);
    switch (step) {
      case 1:
        setEtaText("ETA 4 min");
        setAlertText("Auto aproximándose en mapa");
        break;
      case 2:
        setEtaText("¡En la puerta!");
        setAlertText(`El chofer ${driver.name} ya llegó al origen`);
        setIsArrived(true);
        break;
      case 3:
        setEtaText("En Trayecto");
        setAlertText("Rumbo al Aeropuerto Simón Bolívar (~38 min)");
        break;
      case 4:
        setEtaText("Completado");
        setAlertText("Llegada exitosa al destino");
        setTimeout(() => onRateTrip(), 500);
        break;
    }
  };

  return (
    <section className="bg-white rounded-3xl p-4 lg:p-6 shadow-xl shadow-slate-200/60 border border-slate-100/90 space-y-3 lg:space-y-4" data-purpose="live-trip-tracker">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse"></div>
          <h3 className="text-xs lg:text-sm font-black tracking-wide text-slate-800 uppercase">Live Trip Tracker (GPS)</h3>
        </div>
        <span className="text-[10px] lg:text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Simulador de 4 estados</span>
      </div>

      {/* 4 Botones de Simulación */}
      <div className="grid grid-cols-4 gap-1.5 lg:gap-2 p-1 bg-slate-100 rounded-2xl text-[10px] lg:text-[11px] font-bold text-center">
        {[
          { step: 1, label: "1. En Camino" },
          { step: 2, label: "2. Ya Llegó" },
          { step: 3, label: "3. En Ruta" },
          { step: 4, label: "4. Terminado" },
        ].map((s) => (
          <button
            key={s.step}
            className={`py-2 px-1 lg:py-2.5 rounded-xl transition ${
              activeStep === s.step
                ? "bg-purple-700 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => handleStep(s.step)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Tarjeta del Conductor Asignado en Vivo */}
      <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/50 border border-slate-200 flex items-center gap-3 transition-all">
        <div className="relative flex-shrink-0">
          {driver.image ? (
            <img
              alt={`Conductor ${driver.name}`}
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl object-cover border-2 border-white shadow-md"
              src={driver.image}
            />
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
          <div className="flex items-center justify-between">
            <h4 className="text-xs lg:text-sm font-extrabold text-slate-900 truncate">{driver.name}</h4>
            <span className="text-[11px] lg:text-xs font-black text-purple-700">{etaText}</span>
          </div>
          <p className="text-[11px] lg:text-xs text-slate-600 font-medium">{driver.vehicle} • <strong className="text-slate-900">{driver.plate}</strong></p>
          <div className={`mt-1 flex items-center gap-1.5 text-[11px] lg:text-xs font-bold ${isArrived ? "text-emerald-600" : "text-indigo-700"}`}>
            <span className={`w-2 h-2 rounded-full ${isArrived ? "bg-emerald-600" : "bg-indigo-600 animate-ping"}`}></span>
            <span>{alertText}</span>
          </div>
        </div>
      </div>

      {/* Botones de Acción de Carrera */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          className="py-2.5 px-3 lg:py-3 lg:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          href={`tel:${driver.phone}`}
        >
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Llamar Chofer
        </a>
        <button
          className="py-2.5 px-3 lg:py-3 lg:px-4 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          onClick={onRateTrip}
        >
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Calificar Viaje
        </button>
      </div>
    </section>
  );
}
