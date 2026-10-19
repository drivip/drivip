import type { Carrera, Tenant } from "@drivip/types";
import { useClientesTenant, useTasaCambio } from "@drivip/supabase";

const METODO_META: Record<string, { label: string; icon: string; gradient: string }> = {
  pago_movil: { label: "Pago Móvil", icon: "qr_code_2", gradient: "from-blue-500 to-cyan-500" },
  efectivo: { label: "Efectivo", icon: "payments", gradient: "from-amber-500 to-orange-500" },
  transferencia: { label: "Transferencia", icon: "account_balance", gradient: "from-emerald-500 to-teal-500" },
};

function isSameDay(iso: string | null, ref: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export default function MisPagos({
  carreras,
  tenant,
  tenantId,
}: {
  carreras: Carrera[];
  tenant?: Tenant | null;
  tenantId?: string | null;
}) {
  const { clientes } = useClientesTenant(tenantId);
  const { tasa } = useTasaCambio();

  const hoy = new Date();
  const deHoy = carreras.filter((c) => isSameDay(c.completada_at ?? c.created_at, hoy) && c.estado !== "cancelada");

  const resumen = deHoy.reduce(
    (acc, c) => {
      const metodo = c.metodo_pago ?? "efectivo";
      const precio = c.precio ?? 0;
      acc.total += precio;
      acc[metodo] = (acc[metodo] ?? 0) + precio;
      acc.count[metodo] = (acc.count[metodo] ?? 0) + 1;
      return acc;
    },
    { total: 0, count: {} as Record<string, number>, efectivo: 0, pago_movil: 0, transferencia: 0 }
  );

  const nombreCliente = (clienteId: string | null) => {
    if (!clienteId) return "Pasajero";
    return clientes.find((c) => c.profile_id === clienteId)?.nombre ?? "Pasajero";
  };

  const vencimiento = tenant?.fecha_vencimiento
    ? Math.max(0, Math.ceil((new Date(tenant.fecha_vencimiento).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Billetera</h1>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div>
            <p className="text-sm lg:text-base font-bold text-slate-900 capitalize">Plan {tenant?.plan ?? "—"}</p>
            <p className="text-[10px] lg:text-[11px] text-slate-500">
              {vencimiento != null ? `Vence en ${vencimiento} días` : "Sin fecha de vencimiento"}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] lg:text-xs font-bold border ${
            tenant?.suscripcion_activa
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-red-100 text-red-700 border-red-200"
          }`}
        >
          {tenant?.suscripcion_activa ? "Al día" : "Vencido"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/60 border border-slate-100">
          <span className="text-[11px] lg:text-xs font-bold text-blue-600 flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
            Pago Móvil
          </span>
          <p className="text-xl lg:text-2xl font-black text-slate-900">${(resumen.pago_movil ?? 0).toFixed(2)}</p>
          <p className="text-[11px] lg:text-xs text-slate-500">
            {tasa ? `Bs. ${((resumen.pago_movil ?? 0) * tasa).toFixed(2)}` : "Tasa BCV no disponible"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] lg:text-[11px] text-slate-500">{resumen.count.pago_movil ?? 0} carreras</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/60 border border-slate-100">
          <span className="text-[11px] lg:text-xs font-bold text-amber-600 flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[14px]">payments</span>
            Efectivo
          </span>
          <p className="text-xl lg:text-2xl font-black text-slate-900">${(resumen.efectivo ?? 0).toFixed(2)}</p>
          <p className="text-[11px] lg:text-xs text-slate-500">Caja física</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] lg:text-[11px] text-slate-500">{resumen.count.efectivo ?? 0} carreras</span>
            <span className="text-[10px] lg:text-[11px] font-bold text-slate-900">${resumen.total.toFixed(2)} Total</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center justify-between">
        <span className="text-[11px] lg:text-xs text-slate-500">Tasa del día (BCV):</span>
        <span className="text-[11px] lg:text-xs font-bold text-blue-600">
          {tasa ? `Bs. ${tasa.toFixed(2)} / USD` : "Sin tasa registrada"}
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm lg:text-base font-black text-slate-900">Carreras de Hoy</h3>

        {deHoy.length === 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-2 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-300">receipt_long</span>
            <p className="text-sm font-semibold text-slate-500">Aún no hay carreras hoy</p>
          </div>
        )}

        {deHoy.map((tx) => {
          const meta = METODO_META[tx.metodo_pago ?? "efectivo"] ?? METODO_META.efectivo;
          const monto = tx.precio ?? 0;
          return (
            <div key={tx.id} className="bg-white rounded-3xl p-3 lg:p-4 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
                <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900 truncate">{nombreCliente(tx.cliente_id)}</p>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tx.estado === "completada" ? "bg-emerald-500" : "bg-amber-500"}`} />
                </div>
                <p className="text-[10px] lg:text-[11px] text-slate-500 truncate">
                  {meta.label} • {tx.origen_direccion ?? "Origen"} → {tx.destino_direccion ?? "Destino"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-emerald-600">+${monto.toFixed(2)}</p>
                {tasa ? <p className="text-[10px] lg:text-[11px] text-slate-500">Bs. {(monto * tasa).toFixed(2)}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
