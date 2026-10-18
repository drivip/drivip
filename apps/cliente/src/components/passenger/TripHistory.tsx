import { useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import type { TripHistory as TripHistoryType } from "../../types/passenger";

interface TripHistoryProps {
  trips: TripHistoryType[];
  onBack: () => void;
}

export default function TripHistory({ trips, onBack }: TripHistoryProps) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripHistoryType | null>(null);

  useScrollLock(showReceipt);

  const openReceipt = (trip: TripHistoryType) => {
    setSelectedTrip(trip);
    setShowReceipt(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* TopBar */}
      <header className="sticky top-0 z-30 bg-[#f4f6f8]/90 backdrop-blur-md px-5 lg:px-8 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/40">
        <button aria-label="Volver atrás" className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center text-slate-700" style={{ boxShadow: "3px 3px 8px #d9dce1, -3px -3px 8px #ffffff" }} onClick={onBack}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight">Historial de Viajes</h1>
          <p className="text-[11px] lg:text-xs font-medium text-emerald-600 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            0% Comisiones • Directo
          </p>
        </div>
        <button aria-label="Filtrar por fecha" className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center text-slate-700" style={{ boxShadow: "3px 3px 8px #d9dce1, -3px -3px 8px #ffffff" }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </button>
      </header>

      {/* MainContent */}
      <main className="px-5 lg:px-8 pt-4 space-y-5 pb-28">
        {/* UserMetricsSummary */}
        <section className="grid grid-cols-2 gap-3.5">
          <div className="p-4 lg:p-5 rounded-3xl border border-slate-100/80 flex flex-col justify-between" style={{ boxShadow: "0 10px 25px -5px rgba(148, 163, 184, 0.2), 0 8px 10px -6px rgba(148, 163, 184, 0.15)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-wide">Viajes</span>
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#6C47FF]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{trips.length}</span>
              <span className="text-xs lg:text-sm font-medium text-slate-400 block mt-0.5">Completados</span>
            </div>
          </div>
          <div className="p-4 lg:p-5 rounded-3xl border border-slate-100/80 flex flex-col justify-between" style={{ boxShadow: "0 10px 25px -5px rgba(148, 163, 184, 0.2), 0 8px 10px -6px rgba(148, 163, 184, 0.15)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-wide">Ahorro</span>
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">~$42.00</span>
              <span className="text-[11px] lg:text-xs font-medium text-slate-400 block mt-0.5">Sin intermediarios</span>
            </div>
          </div>
        </section>

        {/* Filter pills */}
        <section className="overflow-x-auto no-scrollbar -mx-5 px-5 py-1">
          <div className="flex gap-2 w-max">
            <button className="px-4 py-2 rounded-2xl text-xs lg:text-sm font-bold text-white bg-slate-900 shadow-md">Todos ({trips.length})</button>
            <button className="px-4 py-2 rounded-2xl text-xs lg:text-sm font-semibold text-slate-600 bg-white shadow-sm border border-slate-200/80">Esta semana</button>
            <button className="px-4 py-2 rounded-2xl text-xs lg:text-sm font-semibold text-slate-600 bg-white shadow-sm border border-slate-200/80">Completados</button>
            <button className="px-4 py-2 rounded-2xl text-xs lg:text-sm font-semibold text-slate-600 bg-white shadow-sm border border-slate-200/80 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Con Recibo
            </button>
          </div>
        </section>

        {/* RidesListSection */}
        <section className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 space-y-4 lg:space-y-0">
          {trips.map((trip) => (
            <article key={trip.id} className="bg-white rounded-3xl p-4 lg:p-5 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-3.5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs lg:text-sm font-bold text-slate-800">{trip.date}, {trip.time}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] lg:text-xs text-slate-500 font-medium">{trip.type}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] lg:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Pagado Directo
                </span>
              </div>

              {/* Trip Route */}
              <div className="relative pl-6 space-y-3">
                <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-200"></div>
                <div className="relative flex items-start">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <p className="text-[11px] lg:text-xs font-semibold text-slate-400 uppercase leading-none">Punto de Origen</p>
                    <p className="text-xs lg:text-sm font-bold text-slate-800 mt-1">{trip.origin}</p>
                  </div>
                </div>
                <div className="relative flex items-start">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#F97316] ring-4 ring-white shadow-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <p className="text-[11px] lg:text-xs font-semibold text-slate-400 uppercase leading-none">Destino</p>
                    <p className="text-xs lg:text-sm font-bold text-slate-800 mt-1">{trip.destination}</p>
                  </div>
                </div>
              </div>

              {/* Driver & Pricing Summary */}
              <div className="bg-slate-50 rounded-2xl p-3 lg:p-4 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl ${trip.driverColor} flex items-center justify-center font-bold text-xs`}>
                    {trip.driverInitials}
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm font-bold text-slate-900 leading-tight">{trip.driverName}</p>
                    <p className="text-[11px] lg:text-xs text-slate-500 leading-tight">{trip.driverVehicle} • <span className="text-amber-500 font-semibold">⭐ {trip.driverRating}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm lg:text-base font-extrabold text-slate-900 font-mono tracking-tight">${trip.priceUsd.toFixed(2)} <span className="text-[10px] lg:text-[11px] text-slate-500 font-sans font-medium">USD</span></p>
                  <p className="text-[11px] lg:text-xs text-slate-500 font-mono font-medium">Bs. {trip.priceBs.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="flex items-center justify-between text-[11px] lg:text-xs px-1 text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect height="14" rx="2" width="20" x="2" y="5" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  {trip.paymentMethod}
                </span>
                <span className="font-mono text-slate-600 font-semibold">{trip.paymentRef || "Acuerdo Mano a Mano"}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  className="py-2.5 px-3 rounded-2xl text-xs lg:text-sm font-bold text-[#6C47FF] bg-purple-50/60 border border-purple-100 flex items-center justify-center gap-1.5"
                  onClick={() => openReceipt(trip)}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Ver Recibo
                </button>
                <button className="py-2.5 px-3 rounded-2xl text-xs lg:text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5 bg-white border border-slate-200/80">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Repetir Viaje
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* Receipt Modal */}
      {showReceipt && selectedTrip && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8" onClick={() => setShowReceipt(false)}>
          <div className="bg-white w-full max-w-sm sm:max-w-md lg:max-w-xl xl:max-w-2xl rounded-3xl p-5 sm:p-6 lg:p-8 space-y-4 lg:space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-purple-100 text-[#6C47FF] flex items-center justify-center font-black text-xs">D</div>
                <div>
                  <h3 className="text-sm lg:text-base font-extrabold text-slate-900">Recibo Digital Drivip</h3>
                  <p className="text-[10px] lg:text-xs text-emerald-600 font-semibold">100% Directo • 0% Comisiones</p>
                </div>
              </div>
              <button className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center" onClick={() => setShowReceipt(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="rounded-2xl p-4 lg:p-5 space-y-3 text-xs lg:text-sm" style={{ boxShadow: "inset 3px 3px 6px #d9dce1, inset -3px -3px 6px #ffffff" }}>
              <div className="flex justify-between items-center text-slate-500">
                <span>Fecha y Hora</span>
                <span className="font-semibold text-slate-800">{selectedTrip.date}, {selectedTrip.time}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Conductor</span>
                <span className="font-semibold text-slate-800">{selectedTrip.driverName} ({selectedTrip.driverVehicle})</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Ruta</span>
                <span className="font-semibold text-slate-800">{selectedTrip.origin} ➔ {selectedTrip.destination}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Método de Pago</span>
                <span className="font-semibold text-purple-700">{selectedTrip.paymentMethod}</span>
              </div>
              {selectedTrip.paymentRef && (
                <div className="flex justify-between items-center text-slate-500">
                  <span>Referencia Bancaria</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTrip.paymentRef}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Monto Total Pagado</span>
                <div className="text-right">
                  <div className="text-base lg:text-lg font-extrabold text-slate-900 font-mono">${selectedTrip.priceUsd.toFixed(2)} USD</div>
                  <div className="text-[11px] lg:text-xs font-mono text-slate-500">Bs. {selectedTrip.priceBs.toLocaleString()} (Tasa BCV)</div>
                </div>
              </div>
            </div>

            <div className="p-3 lg:p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[11px] lg:text-xs text-emerald-800 leading-tight">
                Este servicio no cobró comisiones corporativas. El 100% del dinero fue a tu chofer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button className="py-3 lg:py-3.5 px-4 rounded-2xl text-xs lg:text-sm font-bold text-slate-800 bg-white border border-slate-200 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                PDF / Guardar
              </button>
              <button className="py-3 lg:py-3.5 px-4 rounded-2xl text-xs lg:text-sm font-bold text-white bg-[#25D366] hover:bg-[#1ebd5a] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
