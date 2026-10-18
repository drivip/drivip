import { useState } from "react";
import { MOCK_CLIENTS } from "../mockData/driverMockData";

export default function MisClientes() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CLIENTS.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) || c.telefono.includes(search)
  );

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Mis Clientes</h1>

      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all shadow-md shadow-slate-200/40"
          placeholder="Buscar cliente..."
        />
      </div>

      <div className="space-y-3">
        {filtered.map((cliente) => (
          <div key={cliente.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <span className="text-sm font-bold">{cliente.nombre.split(" ").map(n => n[0]).join("")}</span>
              </div>
              {cliente.favorito && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <svg className="w-3 h-3 text-white fill-white" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{cliente.nombre}</p>
              <p className="text-[11px] lg:text-xs text-slate-500">{cliente.telefono}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs lg:text-sm font-black text-slate-900">{cliente.carreras} viajes</p>
              <div className="flex items-center gap-0.5 justify-end">
                <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="text-[10px] lg:text-[11px] font-bold text-slate-600">{cliente.calificacion}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
