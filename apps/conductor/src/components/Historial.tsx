import { MOCK_HISTORY } from "../mockData/driverMockData";

export default function Historial() {
  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Historial de Viajes</h1>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <p className="text-xl lg:text-2xl font-black text-emerald-700">{MOCK_HISTORY.length}</p>
            <p className="text-[10px] lg:text-[11px] font-bold text-emerald-600">Viajes</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-purple-50 border border-purple-200">
            <p className="text-xl lg:text-2xl font-black text-purple-700">${MOCK_HISTORY.reduce((s, h) => s + h.precio, 0).toFixed(0)}</p>
            <p className="text-[10px] lg:text-[11px] font-bold text-purple-600">Ganados</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-xl lg:text-2xl font-black text-amber-600">4.8</p>
            <p className="text-[10px] lg:text-[11px] font-bold text-amber-600">Rating</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_HISTORY.map((h) => (
          <div key={h.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] lg:text-xs font-bold text-slate-400">{h.fecha}</span>
              <span className="text-base lg:text-lg font-black text-slate-900">${h.precio.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[11px] font-bold">{h.cliente.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{h.cliente}</p>
                <p className="text-[11px] lg:text-xs text-slate-500 truncate">{h.origen} → {h.destino}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] lg:text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {h.duracion}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">straighten</span>
                {h.distancia} km
              </span>
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-3 h-3 ${i < h.calificacion ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">{h.metodoPago}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
