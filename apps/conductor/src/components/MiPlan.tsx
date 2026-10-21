import type { Tenant } from "@drivip/types";
import { MOCK_DRIVER_PROFILE } from "../mockData/driverMockData";

interface MiPlanProps {
  tenant?: Tenant | null;
  demo?: boolean;
}

export default function MiPlan({ tenant, demo = false }: MiPlanProps) {
  const p = demo ? MOCK_DRIVER_PROFILE : null;
  const plan = tenant?.plan || p?.plan || "estandar";
  const activo = tenant?.suscripcion_activa ?? p?.suscripcionActiva ?? false;
  const vencimiento = tenant?.fecha_vencimiento || p?.fechaVencimiento || null;
  const precio = plan === "profesional" ? "$20" : "$10";

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Mi Plan</h1>

      <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-100">
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-5 lg:p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
              <span className="text-lg lg:text-xl font-black">Plan {plan.toUpperCase()}</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] lg:text-xs font-bold backdrop-blur-sm ${activo ? "bg-white/20" : "bg-red-500/40"}`}>
              {activo ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>
          <p className="text-3xl lg:text-4xl font-black">{precio}<span className="text-base lg:text-lg font-bold opacity-70">/mes</span></p>
          <p className="text-[11px] lg:text-xs text-white/70 mt-1">
            {activo ? `Renovacion automatica` : "Sin suscripcion activa"}
            {vencimiento && ` · Vence: ${new Date(vencimiento).toLocaleDateString("es-VE")}`}
          </p>
        </div>
        <div className="p-4 lg:p-5 space-y-3">
          {[
            { icon: "check_circle", label: "Sin comisiones por viaje", included: true },
            { icon: "check_circle", label: "Carreras ilimitadas", included: true },
            { icon: "check_circle", label: "Soporte prioritario 24/7", included: true },
            { icon: "check_circle", label: "Pagina web personalizada", included: true },
            { icon: "check_circle", label: "QR y PWA propia", included: true },
            { icon: "lock", label: "Plugin Zonas Avanzado", included: false },
          ].map((feat) => (
            <div key={feat.label} className="flex items-center gap-3 py-2">
              <span className={`material-symbols-outlined text-[20px] ${feat.included ? 'text-emerald-500' : 'text-slate-300'}`}>
                {feat.icon}
              </span>
              <span className={`text-sm lg:text-base font-medium ${feat.included ? 'text-slate-900' : 'text-slate-400'}`}>
                {feat.label}
              </span>
              {feat.included && <span className="ml-auto text-[10px] lg:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Incluido</span>}
              {!feat.included && <span className="ml-auto text-[10px] lg:text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Plugin</span>}
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm lg:text-base active:scale-[0.98] transition">
        Gestionar Suscripcion
      </button>
    </div>
  );
}
