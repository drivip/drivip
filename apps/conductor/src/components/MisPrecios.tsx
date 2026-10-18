import { useState } from "react";
import { MOCK_ZONE_PRICING } from "../mockData/driverMockData";

export default function MisPrecios() {
  const [mode, setMode] = useState<"km" | "zona">("km");

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Configurar Tarifas</h1>

      <div className="grid grid-cols-2 p-1 bg-white rounded-2xl border border-slate-200/60 shadow-md shadow-slate-200/40">
        <button
          onClick={() => setMode("km")}
          className={`py-2.5 rounded-xl font-bold text-xs lg:text-sm transition ${mode === "km" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" : "text-slate-600"}`}
        >
          Por Kilómetro
        </button>
        <button
          onClick={() => setMode("zona")}
          className={`py-2.5 rounded-xl font-bold text-xs lg:text-sm transition ${mode === "zona" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" : "text-slate-600"}`}
        >
          Zona Fija
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_ZONE_PRICING.map((p, idx) => (
          <div key={p.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${p.color} text-white flex items-center justify-center shadow-md`}>
                <span className="text-sm font-bold">{idx + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm lg:text-base font-black text-slate-900">{p.zona}</p>
                <p className="text-[10px] lg:text-[11px] text-slate-500">{mode === "km" ? "Tarifa por kilómetro" : "Tarifa fija por zona"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Base ($)</label>
                <p className="text-base lg:text-lg font-black text-slate-900">${p.base.toFixed(2)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">{mode === "km" ? "$/KM" : "Fijo ($)"}</label>
                <p className="text-base lg:text-lg font-black text-slate-900">${p.porKm.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm lg:text-base shadow-lg shadow-purple-600/30 active:scale-[0.98] transition flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[18px]">save</span>
        Guardar Tarifas
      </button>
    </div>
  );
}
