import { MOCK_ALLIES } from "../mockData/driverMockData";

export default function MisAliados() {
  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Mis Aliados</h1>

      {MOCK_ALLIES.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[56px] text-slate-200">group_add</span>
          <p className="text-sm lg:text-base text-slate-400 font-medium">Aún no tienes aliados registrados</p>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs lg:text-sm font-bold active:scale-95 shadow-md">
            Invitar Aliado
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {MOCK_ALLIES.map((ally) => (
            <div key={ally.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{ally.nombre}</p>
                <p className="text-[11px] lg:text-xs text-slate-500">{ally.direccion} • {ally.tipo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm lg:text-base font-black text-slate-900">{ally.carreras}</p>
                <p className="text-[10px] lg:text-[11px] text-slate-500">viajes</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
