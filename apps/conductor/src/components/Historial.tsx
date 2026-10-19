import type { Carrera } from "@drivip/types";
import { useClientesTenant } from "@drivip/supabase";

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  pago_movil: "Pago Móvil",
  transferencia: "Transferencia",
};

function initialsOf(nombre: string): string {
  return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "C";
}

export default function Historial({ carreras, tenantId }: { carreras: Carrera[]; tenantId?: string | null }) {
  const { clientes } = useClientesTenant(tenantId);

  const completadas = carreras.filter((c) => c.estado === "completada");
  const ganancias = completadas.reduce((sum, c) => sum + (c.precio ?? 0), 0);
  const calificadas = carreras.filter((c) => c.calificacion != null);
  const rating = calificadas.length
    ? calificadas.reduce((sum, c) => sum + (c.calificacion ?? 0), 0) / calificadas.length
    : 0;

  const nombreCliente = (clienteId: string | null) => {
    if (!clienteId) return "Pasajero";
    return clientes.find((c) => c.profile_id === clienteId)?.nombre ?? "Pasajero";
  };

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Historial de Viajes</h1>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <p className="text-xl lg:text-2xl font-black text-emerald-700">{completadas.length}</p>
            <p className="text-[10px] lg:text-[11px] font-bold text-emerald-600">Viajes</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-purple-50 border border-purple-200">
            <p className="text-xl lg:text-2xl font-black text-purple-700">${ganancias.toFixed(0)}</p>
            <p className="text-[10px] lg:text-[11px] font-bold text-purple-600">Ganados</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-xl lg:text-2xl font-black text-amber-600">{rating ? rating.toFixed(1) : "—"}</p>
            <p className="text-[10px] lg:text-[11px] font-bold text-amber-600">Rating</p>
          </div>
        </div>
      </div>

      {carreras.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-2 text-center">
          <span className="material-symbols-outlined text-[40px] text-slate-300">history</span>
          <p className="text-sm font-semibold text-slate-500">Todavía no tienes viajes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {carreras.map((h) => {
            const cliente = nombreCliente(h.cliente_id);
            const fecha = new Date(h.created_at);
            return (
              <div key={h.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] lg:text-xs font-bold text-slate-400">
                    {fecha.toLocaleDateString("es-VE")} {fecha.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="text-right">
                    <span className="text-base lg:text-lg font-black text-slate-900">${(h.precio ?? 0).toFixed(2)}</span>
                    <span className="block text-[9px] font-bold uppercase text-slate-400">{h.estado}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[11px] font-bold">{initialsOf(cliente)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{cliente}</p>
                    <p className="text-[11px] lg:text-xs text-slate-500 truncate">{h.origen_direccion ?? "Origen"} → {h.destino_direccion ?? "Destino"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] lg:text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {h.duracion_min ? `${Math.round(h.duracion_min)} min` : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">straighten</span>
                    {h.distancia_km ? `${h.distancia_km.toFixed(1)} km` : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-3 h-3 ${i < (h.calificacion ?? 0) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </span>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                    {METODO_LABEL[h.metodo_pago ?? ""] ?? h.metodo_pago ?? "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
