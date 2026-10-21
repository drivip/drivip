import { useMemo, useState } from "react";
import type { Carrera, Cliente } from "@drivip/types";
import { useClientesTenant } from "@drivip/supabase";
import { useScrollLock } from "../hooks/useScrollLock";

function initialsOf(nombre: string): string {
  return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "C";
}

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-purple-100 text-purple-700" },
  aceptada: { label: "Aceptada", className: "bg-blue-100 text-blue-700" },
  en_curso: { label: "En curso", className: "bg-amber-100 text-amber-700" },
  completada: { label: "Completada", className: "bg-emerald-100 text-emerald-700" },
  cancelada: { label: "Cancelada", className: "bg-rose-100 text-rose-700" },
};

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  pago_movil: "Pago Móvil",
  transferencia: "Transferencia",
};

function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface MisClientesProps {
  tenantId?: string | null;
  carreras?: Carrera[];
  clientesMock?: Cliente[];
}

export default function MisClientes({
  tenantId,
  carreras = [],
  clientesMock,
}: MisClientesProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Cliente | null>(null);
  const { clientes: clientesReales, loading: loadingReal } = useClientesTenant(tenantId);
  const clientes = clientesMock ?? clientesReales;
  const loading = clientesMock ? false : loadingReal;

  useScrollLock(Boolean(selected));

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  const historial = useMemo(() => {
    if (!selected) return [];
    return carreras
      .filter((carrera) =>
        [selected.profile_id, selected.id].filter(Boolean).includes(carrera.cliente_id)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [carreras, selected]);

  const completadas = historial.filter((c) => c.estado === "completada");
  const totalGastado = completadas.reduce((sum, c) => sum + (c.precio ?? 0), 0);

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900">Mis Clientes</h1>
          <p className="text-[11px] lg:text-xs text-slate-500 mt-0.5">
            Datos de contacto e historial de servicios de tus pasajeros.
          </p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1.5 text-[10px] font-black text-purple-700">
          {clientes.length} en total
        </span>
      </div>

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
        {filtered.map((cliente) => {
          const viajes = carreras.filter((carrera) =>
            [cliente.profile_id, cliente.id].filter(Boolean).includes(carrera.cliente_id)
          );
          const ultima = viajes
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          return (
            <button
              key={cliente.id}
              type="button"
              onClick={() => setSelected(cliente)}
              className="w-full bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3 text-left active:scale-[0.99] transition"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold">{initialsOf(cliente.nombre)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{cliente.nombre}</p>
                <p className="text-[11px] lg:text-xs text-slate-500 truncate">{cliente.telefono ?? cliente.email ?? "Sin contacto"}</p>
                {ultima && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    Último viaje: {fechaCorta(ultima.created_at)}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs lg:text-sm font-black text-slate-900">{cliente.total_carreras} viajes</p>
                <p className="text-[10px] lg:text-[11px] text-slate-400">
                  {new Date(cliente.created_at).toLocaleDateString("es-VE")}
                </p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-slate-300">chevron_right</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)} />

          <div className="relative flex h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#f1f4f8] shadow-2xl sm:h-[84dvh] sm:rounded-3xl">
            <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-4 py-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-sm font-black text-white shadow-md">
                {initialsOf(selected.nombre)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-black text-slate-900">{selected.nombre}</h2>
                <p className="truncate text-[10px] font-semibold text-slate-500">
                  Cliente desde {fechaCorta(selected.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
                aria-label="Cerrar cliente"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/60">
                <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Datos del cliente
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Teléfono</p>
                    <p className="mt-0.5 truncate text-[12px] font-bold text-slate-900">
                      {selected.telefono ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Email</p>
                    <p className="mt-0.5 truncate text-[12px] font-bold text-slate-900">
                      {selected.email ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Dirección</p>
                    <p className="mt-0.5 text-[12px] font-bold text-slate-900">
                      {selected.direccion ?? "Sin dirección registrada"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-purple-50 p-2.5 text-center">
                    <p className="text-base font-black text-purple-700">{selected.total_carreras}</p>
                    <p className="text-[9px] font-bold text-purple-500">Viajes</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-2.5 text-center">
                    <p className="text-base font-black text-emerald-700">${totalGastado.toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-emerald-500">Facturado</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-2.5 text-center">
                    <p className="text-base font-black text-amber-600">
                      {completadas.length}
                    </p>
                    <p className="text-[9px] font-bold text-amber-500">Completados</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={selected.telefono ? `tel:${selected.telefono}` : undefined}
                    className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[11px] font-black text-white active:scale-95 ${
                      selected.telefono ? "bg-emerald-600" : "pointer-events-none bg-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">call</span>
                    Llamar
                  </a>
                  <a
                    href={
                      selected.telefono
                        ? `https://wa.me/${selected.telefono.replace(/\D/g, "")}`
                        : undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[11px] font-black text-white active:scale-95 ${
                      selected.telefono ? "bg-[#25D366]" : "pointer-events-none bg-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">chat</span>
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/60">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Historial de servicios
                  </p>
                  <span className="text-[10px] font-bold text-slate-400">{historial.length} registros</span>
                </div>

                {historial.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 py-6 text-center">
                    <span className="material-symbols-outlined text-[32px] text-slate-300">history</span>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Este cliente todavía no tiene servicios contigo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historial.map((carrera) => {
                      const estado = ESTADO_LABEL[carrera.estado] ?? ESTADO_LABEL.pendiente;
                      return (
                        <div key={carrera.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-bold text-slate-900">
                                {carrera.origen_direccion ?? "Origen"}
                              </p>
                              <p className="truncate text-[10px] text-slate-500">
                                → {carrera.destino_direccion ?? "Destino"}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${estado.className}`}>
                              {estado.label}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                            <span>{new Date(carrera.created_at).toLocaleDateString("es-VE")}</span>
                            <span>{carrera.distancia_km ? `${carrera.distancia_km.toFixed(1)} km` : "—"}</span>
                            <span className="capitalize">
                              {METODO_LABEL[carrera.metodo_pago ?? ""] ?? carrera.metodo_pago ?? "—"}
                            </span>
                            <span className="ml-auto text-[12px] font-black text-slate-900">
                              ${(carrera.precio ?? 0).toFixed(2)}
                            </span>
                          </div>
                          {carrera.calificacion != null && (
                            <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <span
                                  key={index}
                                  className="material-symbols-outlined text-[12px]"
                                  style={{
                                    fontVariationSettings:
                                      index < (carrera.calificacion ?? 0)
                                        ? "'FILL' 1"
                                        : "'FILL' 0",
                                  }}
                                >
                                  star
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
