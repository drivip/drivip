import { useState, useEffect } from "react";

interface RouteCalculatorProps {
  onOpenMap: () => void;
  onOpenOriginMap?: () => void;
  fareUsd: string;
  fareBs: string;
  distance: string;
  onRequestRide: () => void;
  onToggleSchedule: (mode: "now" | "schedule") => void;
  origin?: string;
  destination?: string;
  stops?: string[];
}

export default function RouteCalculator({
  onOpenMap,
  onOpenOriginMap,
  fareUsd,
  fareBs,
  distance,
  onRequestRide,
  onToggleSchedule,
  origin: originProp,
  destination: destinationProp,
  stops: stopsProp,
}: RouteCalculatorProps) {
  const [tripMode, setTripMode] = useState<"now" | "schedule">("now");
  const [origin, setOrigin] = useState("Mi ubicación actual");
  const [destination, setDestination] = useState("Aeropuerto Internacional Simón Bolívar");
  const [stops, setStops] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"usd" | "bs" | "pmovil">("usd");
  const [showPagoMovil, setShowPagoMovil] = useState(false);

  useEffect(() => {
    if (originProp !== undefined) setOrigin(originProp);
  }, [originProp]);

  useEffect(() => {
    if (destinationProp !== undefined) setDestination(destinationProp);
  }, [destinationProp]);

  useEffect(() => {
    if (stopsProp !== undefined) setStops(stopsProp);
  }, [stopsProp]);

  const handleToggle = (mode: "now" | "schedule") => {
    setTripMode(mode);
    onToggleSchedule(mode);
  };

  const handlePayment = (method: "usd" | "bs" | "pmovil") => {
    setPaymentMethod(method);
    setShowPagoMovil(method === "pmovil");
  };

  return (
    <section className="bg-white rounded-3xl p-4 lg:p-6 shadow-xl shadow-slate-200/60 border border-slate-100/90 space-y-4" data-purpose="route-calculator">
      {/* Toggle: Pedir Ahora vs Programar */}
      <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60" role="tablist">
        <button
          className={`py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm flex items-center justify-center gap-1.5 transition-all ${tripMode === "now" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          role="tab"
          onClick={() => handleToggle("now")}
        >
          <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"></path>
          </svg>
          Pedir Ahora
        </button>
        <button
          className={`py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm flex items-center justify-center gap-1.5 transition-all ${tripMode === "schedule" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          role="tab"
          onClick={() => handleToggle("schedule")}
        >
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Programar / Reserva
        </button>
      </div>

      {/* Selector Desplegable de Fecha/Hora */}
      {tripMode === "schedule" && (
        <div className="p-3 lg:p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
          <div className="flex items-center justify-between text-indigo-950 font-semibold">
            <span>Fecha y Hora de Recogida:</span>
            <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">Reserva VIP</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="w-full text-xs bg-white border border-indigo-200 rounded-xl px-2.5 py-2 text-slate-700 focus:ring-1 focus:ring-indigo-500" type="date" />
            <input className="w-full text-xs bg-white border border-indigo-200 rounded-xl px-2.5 py-2 text-slate-700 focus:ring-1 focus:ring-indigo-500" type="time" defaultValue="08:30" />
          </div>
        </div>
      )}

      {/* Campos de Dirección: Origen → Escalas → Destino */}
      <div className="relative">
        {/* Línea vertical conectora */}
        {stops.length > 0 && (
          <div className="absolute left-[29px] lg:left-[37px] top-10 bottom-10 w-0.5 bg-slate-200"></div>
        )}

        <div className="space-y-0">
          {/* Origen */}
          <div className="relative flex items-center gap-3 p-3 lg:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 z-10">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth="3" />
                <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Punto de Origen</span>
              <input
                className="w-full bg-transparent border-0 p-0 text-xs lg:text-sm font-bold text-slate-800 focus:ring-0 truncate cursor-pointer"
                readOnly
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                onClick={onOpenOriginMap ?? onOpenMap}
              />
            </div>
            <button
              className="px-2.5 py-1.5 rounded-xl bg-white text-[11px] lg:text-xs font-bold text-emerald-700 shadow-sm border border-emerald-200 flex items-center gap-1 active:scale-95 transition flex-shrink-0"
              onClick={onOpenOriginMap ?? onOpenMap}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Mapa
            </button>
          </div>

          {/* Escalas intermedias */}
          {stops.map((stop, index) => (
            <div key={index} className="relative flex items-center gap-3 py-2 px-3 lg:py-2.5 lg:px-4 z-10">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                <span className="text-xs lg:text-sm font-black">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0 bg-slate-50/90 border border-slate-200/70 rounded-xl px-3 py-2 text-xs lg:text-sm font-bold text-slate-800 truncate">
                {stop || "Escala intermedia"}
              </div>
            </div>
          ))}

          {/* Destino */}
          <div className="relative flex items-center gap-3 p-3 lg:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 z-10">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <circle cx="12" cy="11" r="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Destino del Viaje</span>
              <input
                className="w-full bg-transparent border-0 p-0 text-xs lg:text-sm font-bold text-slate-800 focus:ring-0 truncate cursor-pointer"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onClick={onOpenMap}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de escalas */}
      {stops.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] lg:text-xs text-slate-500 font-medium">
            {stops.length} escala{stops.length > 1 ? "s" : ""} agregada{stops.length > 1 ? "s" : ""}
          </span>
          <button
            className="text-[11px] lg:text-xs text-purple-600 font-bold active:scale-95 transition"
            onClick={onOpenMap}
          >
            + Agregar otra
          </button>
        </div>
      )}

      {stops.length === 0 && (
        <button
          className="w-full py-2.5 rounded-xl bg-purple-50 border border-dashed border-purple-300 text-[11px] lg:text-xs font-bold text-purple-700 flex items-center justify-center gap-1.5 active:scale-[0.98] transition hover:bg-purple-100"
          onClick={onOpenMap}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Añadir Escala (desde el mapa)
        </button>
      )}

      {/* Tarifa Calculada Directa */}
      <div className="p-3.5 lg:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[11px] lg:text-xs font-medium">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>{distance}</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl lg:text-3xl font-black text-white">{fareUsd}</span>
            <span className="text-xs lg:text-sm font-bold text-slate-300">USD</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] lg:text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Tasa Oficial BCV</span>
          <span className="text-sm lg:text-base font-extrabold text-amber-400">{fareBs}</span>
        </div>
      </div>

      {/* SELECTOR DE PAGO DIRECTO */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs lg:text-sm">
          <span className="font-bold text-slate-700">Método de Pago Directo</span>
          <span className="text-[10px] lg:text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Sin Billetera Virtual</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "usd" as const, label: "Efectivo $", sub: "Dólares mano" },
            { id: "bs" as const, label: "Efectivo BS", sub: "Bolívares" },
            { id: "pmovil" as const, label: "Pago Móvil", sub: "Directo Chofer" },
          ].map((opt) => (
            <button
              key={opt.id}
              className={`p-2.5 lg:p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition text-center shadow-sm ${
                paymentMethod === opt.id
                  ? "border-2 border-purple-600 bg-purple-50/60 text-purple-900"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => handlePayment(opt.id)}
            >
              <span className="text-xs lg:text-sm font-black">{opt.label}</span>
              <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">{opt.sub}</span>
            </button>
          ))}
        </div>

        {/* Botón Pago Móvil WhatsApp */}
        {showPagoMovil && (
          <div className="p-3 lg:p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
            <div className="text-[11px] lg:text-xs text-amber-900 leading-tight">
              <strong className="block font-bold">Pago acordado sin comisiones:</strong>
              Transfiere al chofer y envía el capture al WhatsApp.
            </div>
            <a
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow active:scale-95 flex items-center gap-1 flex-shrink-0"
              href="https://wa.me/584120000000?text=Hola%20acabo%20de%20solicitar%20el%20viaje%20en%20Drivip%20te%20env%C3%ADo%20el%20capture"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Botón Principal de Solicitud */}
      <button
        className="w-full py-4 lg:py-5 px-5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm lg:text-base tracking-wide shadow-lg shadow-purple-600/30 flex items-center justify-between active:scale-[0.98] transition"
        onClick={onRequestRide}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Solicitar Conductor Directo</span>
        </div>
        <span className="text-xs lg:text-sm bg-white/20 px-2.5 py-1 rounded-xl backdrop-blur-sm font-bold">Llega en ~4 min</span>
      </button>
    </section>
  );
}
