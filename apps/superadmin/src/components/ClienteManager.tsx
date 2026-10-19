import { useState, useMemo } from "react";
import { useClientes, useClienteDetail, useTenants } from "@drivip/supabase";
import ClienteDetailPanel from "./ClienteDetailPanel";

type FilterType = "all" | "with_rides" | "without_rides" | "with_network";

export default function ClienteManager() {
  const { clientes, loading, refetch } = useClientes();
  const { tenants } = useTenants();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { cliente: selectedCliente, loading: detailLoading } = useClienteDetail(
    selectedClienteId
  );

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono && c.telefono.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const matchFilter =
        filter === "all" ||
        (filter === "with_rides" && (c.total_carreras || 0) > 0) ||
        (filter === "without_rides" && (c.total_carreras || 0) === 0) ||
        (filter === "with_network" && c.red_conductores.length > 0);

      const matchTenant =
        tenantFilter === "all" ||
        c.tenant_id === tenantFilter ||
        c.red_conductores.some((r) => r.conductor_tenant_id === tenantFilter);

      return matchSearch && matchFilter && matchTenant;
    });
  }, [clientes, search, filter, tenantFilter]);

  const totalConCarreras = clientes.filter((c) => (c.total_carreras || 0) > 0).length;
  const totalSinCarreras = clientes.filter((c) => (c.total_carreras || 0) === 0).length;
  const totalConRed = clientes.filter((c) => c.red_conductores.length > 0).length;

  if (selectedClienteId && selectedCliente) {
    return (
      <ClienteDetailPanel
        cliente={selectedCliente}
        onBack={() => setSelectedClienteId(null)}
        onRemoved={() => {
          setSelectedClienteId(null);
          refetch();
        }}
      />
    );
  }

  if (selectedClienteId && detailLoading) {
    return (
      <div className="px-4 lg:px-8 py-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const FILTERS: { id: FilterType; label: string; count: number; color: string }[] = [
    { id: "all", label: "Todos", count: clientes.length, color: "blue" },
    { id: "with_rides", label: "Con carreras", count: totalConCarreras, color: "emerald" },
    { id: "without_rides", label: "Sin carreras", count: totalSinCarreras, color: "amber" },
    { id: "with_network", label: "Con red", count: totalConRed, color: "purple" },
  ];

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <h2 className="text-base lg:text-lg font-black text-slate-900">Gestion de Clientes</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-blue-600">group</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">{loading ? "..." : clientes.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Total</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">local_taxi</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-emerald-600 block leading-tight">{loading ? "..." : totalConCarreras}</span>
          <span className="text-[10px] text-slate-500 font-medium">Con carreras</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-amber-600">person_off</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-amber-600 block leading-tight">{loading ? "..." : totalSinCarreras}</span>
          <span className="text-[10px] text-slate-500 font-medium">Sin carreras</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-purple-600">hub</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-purple-600 block leading-tight">{loading ? "..." : totalConRed}</span>
          <span className="text-[10px] text-slate-500 font-medium">Con red</span>
        </div>
      </div>

      {/* Tenant Filter */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">business</span>
        <select
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
        >
          <option value="all">Todos los conductores</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400 pointer-events-none">expand_more</span>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, telefono o email..."
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

      {/* Cliente List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-[40px] text-slate-300">search_off</span>
          <p className="text-[12px] text-slate-400 mt-2">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id}>
                <button
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(c.id);
                    }
                  }}
                  className="w-full text-left bg-white rounded-2xl p-4 space-y-2 border border-slate-100 active:scale-[0.99] transition"
                  style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">{c.nombre.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] lg:text-[14px] font-bold text-slate-900 block truncate">{c.nombre}</span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">{c.telefono || c.email || "Sin contacto"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {c.red_conductores.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">{c.red_conductores.length} red</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${(c.total_carreras || 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.total_carreras || 0} carreras
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] lg:text-[11px] text-slate-500">
                    <span className="font-bold text-blue-500">{c.tenant_nombre || "Sin conductor asignado"}</span>
                    <span>·</span>
                    <span>{new Date(c.created_at).toLocaleDateString("es-VE")}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mx-2 mb-2 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <span className="ml-1 font-bold text-slate-900">{c.email || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Direccion:</span>
                        <span className="ml-1 font-bold text-slate-900 truncate block">{c.direccion || "-"}</span>
                      </div>
                    </div>
                    {c.red_conductores.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Conductores en su red:</span>
                        <div className="mt-1.5 space-y-1">
                          {c.red_conductores.map((r) => (
                            <div key={r.id} className="flex items-center gap-2 text-[11px]">
                              <span className="material-symbols-outlined text-[12px] text-blue-500">local_taxi</span>
                              <span className="font-bold text-slate-900">{r.conductor_nombre || "Desconocido"}</span>
                              {r.favorito && <span className="material-symbols-outlined text-[11px] text-amber-500">star</span>}
                              {r.apodo && <span className="text-slate-400">({r.apodo})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClienteId(c.id);
                      }}
                      className="w-full py-2 rounded-xl bg-blue-600 text-white text-[11px] font-bold active:scale-95 transition mt-2"
                    >
                      Ver detalle completo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
