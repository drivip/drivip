import { useState } from "react";
import type { Driver } from "../../types/passenger";
import AddConductorModal from "./AddConductorModal";

interface DriversListProps {
  drivers: Driver[];
  onBack: () => void;
  onRequestRide: (driver: Driver) => void;
  onConductorAdded?: () => void;
}

type FilterType = "all" | "online" | "taxi" | "moto";

export default function DriversList({ drivers, onBack, onRequestRide, onConductorAdded }: DriversListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<"search" | "qr">("search");

  const filtered = drivers.filter((d) => {
    if (activeFilter === "online") return d.status === "available";
    if (activeFilter === "taxi") return d.vehicle.includes("Toyota") || d.vehicle.includes("Chevrolet");
    if (activeFilter === "moto") return d.vehicle.includes("Moto") || d.vehicle.includes("Keeway");
    return true;
  });

  const filters: { id: FilterType; label: string; count: number; icon: React.ReactNode }[] = [
    { id: "all", label: "Todos", count: drivers.length, icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )},
    { id: "online", label: "En Linea", count: drivers.filter((d) => d.status === "available").length, icon: (
      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
    )},
    { id: "taxi", label: "Taxis", count: drivers.filter((d) => d.vehicle.includes("Toyota") || d.vehicle.includes("Chevrolet")).length, icon: (
      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )},
    { id: "moto", label: "Moto Taxis", count: drivers.filter((d) => d.vehicle.includes("Moto") || d.vehicle.includes("Keeway")).length, icon: (
      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 7h-3V6a4 4 0 00-8 0v1H5a1 1 0 00-1 1v11a3 3 0 003 3h10a3 3 0 003-3V8a1 1 0 00-1-1zM10 6a2 2 0 014 0v1h-4V6z" />
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f4f6f8]/95 backdrop-blur-md px-4 lg:px-8 pt-3 pb-3 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <button
            aria-label="Volver"
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-all border border-slate-100"
            style={{ boxShadow: "3px 3px 8px #d9dce1, -3px -3px 8px #ffffff" }}
            onClick={onBack}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight">Mis Conductores VIP</h1>
            </div>
            <p className="text-[11px] lg:text-xs font-medium text-slate-400">Directo en Venezuela • Sin intermediarios</p>
          </div>
          <button
            aria-label="Escanear QR"
            onClick={() => { setAddTab("qr"); setAddOpen(true); }}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-violet-700 active:scale-95 transition-all border border-slate-100"
            style={{ boxShadow: "3px 3px 8px #d9dce1, -3px -3px 8px #ffffff" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Status badge banner */}
        <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-transparent p-2.5 rounded-2xl border border-violet-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs lg:text-sm font-semibold text-violet-950">Módulo Multi-Chofer Confiable</p>
          </div>
          <span className="text-[11px] lg:text-xs font-bold bg-violet-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">0% Comisión</span>
        </div>

        <button
          onClick={() => { setAddTab("search"); setAddOpen(true); }}
          className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs lg:text-sm font-black shadow-lg shadow-violet-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[19px]">person_add</span>
          Buscar o escanear un conductor
        </button>
      </header>

      {/* Filter Tabs */}
      <nav className="px-4 lg:px-8 mt-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`flex-shrink-0 px-4 py-2 text-xs lg:text-sm font-bold rounded-2xl flex items-center gap-1.5 transition-all active:scale-95 ${
                activeFilter === f.id
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25"
                  : "bg-white text-slate-600 shadow-sm border border-slate-200/80 hover:bg-slate-50"
              }`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.icon}
              <span>{f.label} ({f.count})</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Drivers List */}
      <main className="px-4 lg:px-8 mt-4 pb-28">
        <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 space-y-4 lg:space-y-0">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[28px] text-slate-400">person_off</span>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {drivers.length === 0 ? "Aún no tienes conductores" : "No hay conductores en esta categoria"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {drivers.length === 0 ? "Busca por nombre o escanea el QR de tu conductor" : "Intenta con otro filtro"}
              </p>
              {drivers.length === 0 && (
                <button
                  onClick={() => { setAddTab("search"); setAddOpen(true); }}
                  className="mt-3 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold active:scale-95"
                >
                  Agregar mi primer conductor
                </button>
              )}
            </div>
          ) : filtered.map((driver) => (
            <article key={driver.id} className="bg-white rounded-3xl p-4 lg:p-5 border border-slate-100/90 relative overflow-hidden" style={{ boxShadow: "0 12px 30px -10px rgba(148, 163, 184, 0.25), 0 2px 8px -2px rgba(148, 163, 184, 0.15)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {driver.image ? (
                      <img alt={`Foto de perfil de ${driver.name}`} className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl object-cover shadow-sm border-2 border-violet-100" src={driver.image} />
                    ) : (
                      <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl ${driver.color} font-black text-lg flex items-center justify-center shadow-sm`}>
                        {driver.initials}
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${driver.status === "available" ? "bg-emerald-500" : driver.status === "busy" ? "bg-amber-500" : "bg-slate-400"}`}></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base lg:text-lg font-bold text-slate-900 leading-tight">{driver.name}</h2>
                      <span className="bg-amber-100 text-amber-800 text-[10px] lg:text-[11px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <svg className="w-3 h-3 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {driver.rating}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-500 font-medium mt-0.5">{driver.vehicle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-100 text-slate-600 text-[10px] lg:text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md">{driver.plate}</span>
                      <span className="text-[11px] lg:text-xs text-slate-400">• {driver.trips} viajes</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] lg:text-xs font-bold ${
                  driver.status === "available"
                    ? "bg-emerald-50 border border-emerald-200/60 text-emerald-700"
                    : driver.status === "busy"
                      ? "bg-amber-50 border border-amber-200 text-amber-700"
                      : "bg-slate-50 border border-slate-200 text-slate-500"
                }`}>
                  {driver.status === "available" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                  {driver.status === "busy" && <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                  {driver.availability}
                </span>
              </div>

              {/* Payment Methods */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] lg:text-xs font-medium text-slate-400">Recibe:</span>
                <div className="flex items-center gap-1.5">
                  {driver.paymentMethods.map((method) => (
                    <span key={method} className={`px-2 py-0.5 rounded-lg border text-[10px] lg:text-[11px] font-semibold ${
                      method === "Pago Móvil"
                        ? "bg-violet-50 border-violet-200/80 text-violet-700"
                        : "bg-slate-50 border-slate-200/80 text-slate-700"
                    }`}>
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <a
                  className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs lg:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-400/30 active:scale-98 transition-transform"
                  href={`https://wa.me/${driver.whatsapp}?text=Hola%20${driver.name.split(" ")[0]},%20vi%20tu%20perfil%20en%20Drivip`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.54 1.764.814 2.796.814 3.18 0 5.766-2.587 5.766-5.766 0-3.18-2.586-5.766-5.766-5.766zm9.969 5.766c0 5.518-4.482 10-10 10-1.745 0-3.385-.45-4.821-1.242l-5.179 1.358 1.385-5.062c-.879-1.488-1.385-3.226-1.385-5.054 0-5.518 4.482-10 10-10 5.518 0 10 4.482 10 10z" />
                  </svg>
                  <span>WhatsApp directo</span>
                </a>
                <button
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs lg:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 active:scale-98 transition-transform"
                  onClick={() => onRequestRide(driver)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Pedir Carrera</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <AddConductorModal
        open={addOpen}
        initialTab={addTab}
        onClose={() => setAddOpen(false)}
        onAdded={() => onConductorAdded?.()}
      />
    </div>
  );
}
