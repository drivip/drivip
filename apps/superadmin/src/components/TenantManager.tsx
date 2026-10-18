import { useState } from "react";
import type { Tenant } from "@drivip/types";
import TenantDetailPanel from "./TenantDetailPanel";

interface TenantManagerProps {
  tenants: Tenant[];
  loading: boolean;
}

type FilterStatus = "all" | "active" | "paused" | "inactive";

export default function TenantManager({ tenants, loading }: TenantManagerProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.nombre.toLowerCase().includes(q) || t.slug.includes(q) || (t.vehiculo_placa && t.vehiculo_placa.toLowerCase().includes(q));
    const matchFilter =
      filter === "all" ||
      (filter === "active" && t.suscripcion_activa && !t.pausado) ||
      (filter === "paused" && t.pausado) ||
      (filter === "inactive" && !t.suscripcion_activa && !t.pausado);
    return matchSearch && matchFilter;
  });

  const totalActivos = tenants.filter((t) => t.suscripcion_activa && !t.pausado).length;
  const totalPausados = tenants.filter((t) => t.pausado).length;
  const totalInactivos = tenants.filter((t) => !t.suscripcion_activa && !t.pausado).length;

  if (selectedTenantId) {
    return <TenantDetailPanel tenantId={selectedTenantId} onBack={() => setSelectedTenantId(null)} />;
  }

  const FILTERS: { id: FilterStatus; label: string; count: number; color: string }[] = [
    { id: "all", label: "Todos", count: tenants.length, color: "blue" },
    { id: "active", label: "Activos", count: totalActivos, color: "emerald" },
    { id: "paused", label: "Pausados", count: totalPausados, color: "amber" },
    { id: "inactive", label: "Inactivos", count: totalInactivos, color: "red" },
  ];

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <h2 className="text-base lg:text-lg font-black text-slate-900">Gestion de Conductores</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-blue-600">business</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">{loading ? "..." : tenants.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Total</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-emerald-600 block leading-tight">{loading ? "..." : totalActivos}</span>
          <span className="text-[10px] text-slate-500 font-medium">Activos</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-amber-600">pause_circle</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-amber-600 block leading-tight">{loading ? "..." : totalPausados}</span>
          <span className="text-[10px] text-slate-500 font-medium">Pausados</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-red-600">cancel</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-red-500 block leading-tight">{loading ? "..." : totalInactivos}</span>
          <span className="text-[10px] text-slate-500 font-medium">Inactivos</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, slug o placa..."
          className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-[12px] text-slate-900 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`px-3 py-1.5 rounded-full text-[10px] lg:text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
              filter === opt.id ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {opt.label} {opt.count}
          </button>
        ))}
      </div>

      {/* Tenant List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-[40px] text-slate-300">search_off</span>
          <p className="text-[12px] text-slate-400 mt-2">No se encontraron conductores</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTenantId(t.id)}
              className="w-full text-left bg-white rounded-2xl p-4 space-y-2 border border-slate-100 active:scale-[0.99] transition"
              style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">{t.nombre.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[13px] lg:text-[14px] font-bold text-slate-900 block truncate">{t.nombre}</span>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">{t.slug}.drivip.app</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {t.pausado && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">Pausado</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${t.suscripcion_activa ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {t.suscripcion_activa ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] lg:text-[11px] text-slate-500">
                {t.vehiculo_placa && (
                  <>
                    <span className="font-mono font-bold">{t.vehiculo_placa}</span>
                    <span>·</span>
                  </>
                )}
                <span className="capitalize">{t.vehiculo_tipo || "sin vehiculo"}</span>
                <span>·</span>
                <span className="font-bold uppercase">{t.plan}</span>
                {t.ciudad && (
                  <>
                    <span>·</span>
                    <span className="text-blue-500 font-bold">{t.ciudad}</span>
                  </>
                )}
                {t.calificacion && (
                  <>
                    <span>·</span>
                    <span className="text-amber-500 font-bold">{t.calificacion.toFixed(1)}</span>
                  </>
                )}
                <span>·</span>
                <span>{t.total_clientes || 0} clientes</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
