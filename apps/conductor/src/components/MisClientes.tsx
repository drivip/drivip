import { useState } from "react";
import { useClientesTenant } from "@drivip/supabase";

function initialsOf(nombre: string): string {
  return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "C";
}

export default function MisClientes({ tenantId }: { tenantId?: string | null }) {
  const [search, setSearch] = useState("");
  const { clientes, loading } = useClientesTenant(tenantId);

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

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

      {loading && (
        <p className="text-center text-xs text-slate-400 py-6">Cargando clientes...</p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-2 text-center">
          <span className="material-symbols-outlined text-[40px] text-slate-300">group</span>
          <p className="text-sm font-semibold text-slate-500">
            {clientes.length === 0 ? "Aún no tienes clientes registrados" : "Sin resultados"}
          </p>
          <p className="text-xs text-slate-400">
            {clientes.length === 0 ? "Aparecerán cuando te soliciten una carrera." : "Prueba con otro nombre o teléfono."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((cliente) => (
          <div key={cliente.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <span className="text-sm font-bold">{initialsOf(cliente.nombre)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{cliente.nombre}</p>
              <p className="text-[11px] lg:text-xs text-slate-500 truncate">{cliente.telefono ?? cliente.email ?? "Sin contacto"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs lg:text-sm font-black text-slate-900">{cliente.total_carreras} viajes</p>
              <p className="text-[10px] lg:text-[11px] text-slate-400">
                {new Date(cliente.created_at).toLocaleDateString("es-VE")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
