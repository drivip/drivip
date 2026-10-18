import type { SavedAddress } from "../../types/passenger";
import { MOCK_QUICK_ADDRESSES } from "../../mockData/passengerMockData";

interface SavedAddressesProps {
  addresses: SavedAddress[];
  onBack: () => void;
}

export default function SavedAddresses({ addresses, onBack }: SavedAddressesProps) {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* TopHeader */}
      <header className="sticky top-0 z-30 bg-[#f4f6f8]/90 backdrop-blur-md px-5 lg:px-8 pt-4 pb-3 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <button aria-label="Regresar" className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-transform border border-slate-100" style={{ boxShadow: "3px 3px 8px #e2e8f0, -3px -3px 8px #ffffff" }} onClick={onBack}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">Direcciones Guardadas</h1>
            <p className="text-[11px] lg:text-xs font-medium text-emerald-600 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Toda Venezuela
            </p>
          </div>
          <button aria-label="Nueva dirección" className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25 flex items-center justify-center text-white active:scale-95 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </header>

      {/* MainContent */}
      <main className="px-5 lg:px-8 pt-3 space-y-5 pb-28">
        {/* SearchBar */}
        <section>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input className="w-full pl-11 pr-11 py-3.5 lg:py-4 bg-white border border-slate-200/80 rounded-2xl text-sm lg:text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all" placeholder="Buscar una dirección o lugar en Venezuela..." type="text" />
          </div>
        </section>

        {/* QuickAccessShortcuts */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-500">Acceso Rápido (1 Toque)</h2>
            <span className="text-[11px] lg:text-xs font-semibold text-purple-600">Personalizar</span>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
            {MOCK_QUICK_ADDRESSES.map((qa) => (
              <button key={qa.name} className="bg-white p-3 lg:p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all text-center group" style={{ boxShadow: "3px 3px 8px #e2e8f0, -3px -3px 8px #ffffff" }}>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${qa.bg} flex items-center justify-center shadow-inner group-hover:opacity-90 transition-colors`}>
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xs lg:text-sm font-bold text-slate-800">{qa.name}</span>
                <span className="text-[10px] lg:text-[11px] text-slate-400 font-medium truncate w-full">{qa.short}</span>
              </button>
            ))}
          </div>
        </section>

        {/* SavedAddressesList */}
        <section className="space-y-3.5 lg:space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-500">Direcciones Frecuentes Guardadas</h2>
            <span className="text-xs lg:text-sm font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">{addresses.length} guardadas</span>
          </div>

          <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 space-y-3.5 lg:space-y-0">
            {addresses.map((addr) => (
              <article key={addr.id} className={`bg-white rounded-3xl p-4 lg:p-5 border border-slate-100 transition-all ${addr.isDefault ? "shadow-xl shadow-slate-200/60 relative overflow-hidden" : "shadow-xl shadow-slate-200/60"}`}>
                {addr.isDefault && (
                  <div className="absolute top-0 right-0">
                    <span className="bg-emerald-500 text-white text-[10px] lg:text-[11px] font-bold px-3 py-1 rounded-bl-xl tracking-wider shadow-sm flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                      </svg>
                      PREDETERMINADA
                    </span>
                  </div>
                )}

                <div className={`flex items-start gap-3.5 ${addr.isDefault ? "pt-1" : ""}`}>
                  <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-sm ${addr.iconBg}`}>
                    <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {addr.icon === "home" && <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" strokeLinecap="round" strokeLinejoin="round" />}
                      {addr.icon === "business" && <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round" />}
                      {addr.icon === "shopping_bag" && <path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" strokeLinecap="round" strokeLinejoin="round" />}
                      {addr.icon === "flight" && <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round" />}
                      {addr.icon === "local_hospital" && <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />}
                    </svg>
                  </div>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base lg:text-lg leading-tight">{addr.name}</h3>
                      {addr.badge && <span className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded ${addr.badgeColor}`}>{addr.badge}</span>}
                    </div>
                    <p className="text-xs lg:text-sm text-slate-600 mt-1 font-medium leading-relaxed">{addr.address}</p>
                    {addr.reference && (
                      <p className="text-[11px] lg:text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        {addr.reference}
                      </p>
                    )}
                    {addr.driverNote && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded-lg text-[11px] lg:text-xs font-medium">
                        <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                        </svg>
                        <span>Nota Chofer: {addr.driverNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                {addr.isDefault && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-slate-400 hover:text-purple-600 active:scale-95 transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-500 active:scale-95 transition-colors" title="Eliminar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <button className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-semibold text-xs lg:text-sm py-2 px-4 rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-1.5">
                      <span>Pedir Chofer Aquí</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* AddNewLocationCard */}
        <section className="pt-2">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-5 lg:p-6 border-2 border-dashed border-purple-200 shadow-sm text-center">
            <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm lg:text-base font-bold text-slate-900">¿Tienes un nuevo punto frecuente?</h4>
            <p className="text-xs lg:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Guarda la ubicación de tu universidad, consultorio o familiares para solicitar viajes con 1 toque.
            </p>
            <button className="mt-4 w-full py-3 lg:py-3.5 px-4 bg-white border border-purple-300 text-purple-700 font-bold text-xs lg:text-sm rounded-2xl hover:bg-purple-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2" style={{ boxShadow: "3px 3px 8px #e2e8f0, -3px -3px 8px #ffffff" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              + Agregar Nueva Ubicación en el Mapa
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
