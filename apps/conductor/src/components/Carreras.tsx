import { useState } from "react";
import type { Carrera } from "@drivip/types";

interface Props {
  carreras: Carrera[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
}

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "pendiente", label: "Pendientes" },
  { id: "en_curso", label: "En Curso" },
  { id: "completada", label: "Completadas" },
];

export default function Carreras({ carreras, onAccept, onReject, onComplete }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = carreras.filter((c) => {
    const matchesSearch = search === "" ||
      c.origen_direccion?.toLowerCase().includes(search.toLowerCase()) ||
      c.destino_direccion?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.estado === filter;
    return matchesSearch && matchesFilter;
  });

  const statusStyles: Record<string, { bg: string; label: string }> = {
    completada: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Completada" },
    en_curso: { bg: "bg-amber-100 text-amber-700 border-amber-200", label: "En Curso" },
    aceptada: { bg: "bg-blue-100 text-blue-700 border-blue-200", label: "Aceptada" },
    pendiente: { bg: "bg-purple-100 text-purple-700 border-purple-200", label: "Pendiente" },
    cancelada: { bg: "bg-red-100 text-red-600 border-red-200", label: "Cancelada" },
  };

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Carreras</h1>

      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all shadow-md shadow-slate-200/40"
          placeholder="Buscar por dirección..."
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-2 text-xs lg:text-sm font-bold rounded-2xl transition-all active:scale-95 ${
              filter === f.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                : 'bg-white text-slate-600 shadow-sm border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-slate-300">local_taxi</span>
            <p className="text-sm lg:text-base text-slate-400 font-medium">No hay carreras</p>
          </div>
        ) : (
          filtered.map((carrera) => {
            const status = statusStyles[carrera.estado] || statusStyles.pendiente;
            return (
              <div key={carrera.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-[18px]">local_taxi</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{carrera.origen_direccion ?? "Origen"}</p>
                      <p className="text-[11px] lg:text-xs text-slate-500 truncate">→ {carrera.destino_direccion ?? "Destino"}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] lg:text-[11px] font-bold border ${status.bg}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] lg:text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">straighten</span>
                    {carrera.distancia_km ?? 0} km
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {carrera.duracion_min ?? 0} min
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    {carrera.metodo_pago}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-base lg:text-lg font-black text-slate-900">${carrera.precio}</span>
                  <div className="flex items-center gap-2">
                    {carrera.estado === "pendiente" && (
                      <>
                        <button onClick={() => onReject(carrera.id)} className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] lg:text-xs font-bold active:scale-95">
                          Rechazar
                        </button>
                        <button onClick={() => onAccept(carrera.id)} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] lg:text-xs font-bold active:scale-95 shadow-md shadow-emerald-500/25">
                          Aceptar
                        </button>
                      </>
                    )}
                    {(carrera.estado === "aceptada" || carrera.estado === "en_curso") && (
                      <button onClick={() => onComplete(carrera.id)} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white text-[11px] lg:text-xs font-bold active:scale-95 shadow-md shadow-purple-500/25">
                        {carrera.estado === "en_curso" ? "Finalizar" : "Completar"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
