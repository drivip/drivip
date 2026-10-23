import { useState } from "react";
import { useConfigReferidos } from "@drivip/supabase";
import type { Tenant } from "@drivip/types";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  color: string;
  gradient: string;
  features: PlanFeature[];
  conductores: number;
  activo: boolean;
}

const INITIAL_PLANS: Plan[] = [
  {
    id: "estandar",
    name: "Estándar",
    price: 10,
    color: "slate",
    gradient: "from-slate-500 to-gray-600",
    conductores: 1240,
    activo: true,
    features: [
      { name: "Perfil básico de conductor", included: true },
      { name: "Hasta 20 viajes/mes", included: true },
      { name: "Posición estándar en búsquedas", included: true },
      { name: "Soporte por email", included: true },
      { name: "Pago móvil y efectivo", included: true },
      { name: "Destacado en resultados", included: false },
      { name: "Badge de verificado", included: false },
      { name: "Prioridad en matching", included: false },
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 20,
    color: "purple",
    gradient: "from-purple-500 to-indigo-600",
    conductores: 860,
    activo: true,
    features: [
      { name: "Perfil premium con fotos", included: true },
      { name: "Viajes ilimitados", included: true },
      { name: "Posición mejorada en búsquedas", included: true },
      { name: "Badge de conductor verificado", included: true },
      { name: "Soporte prioritario por WhatsApp", included: true },
      { name: "Todos los métodos de pago", included: true },
      { name: "Estadísticas avanzadas", included: true },
      { name: "Primera posición garantizada", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 30,
    color: "amber",
    gradient: "from-amber-500 to-orange-500",
    conductores: 400,
    activo: true,
    features: [
      { name: "Todo del plan Profesional", included: true },
      { name: "Primera posición en búsquedas", included: true },
      { name: "Badge Premium exclusivo", included: true },
      { name: "Prioridad máxima en matching", included: true },
      { name: "Soporte telefónico 24/7", included: true },
      { name: "Dashboard de analytics completo", included: true },
      { name: "Promociones destacadas", included: true },
      { name: "Acceso anticipado a nuevas funciones", included: true },
    ],
  },
];

const POSITION_RULES = [
  { plan: "Premium", position: "#1", color: "text-amber-600", bg: "bg-amber-50", desc: "Primera posición en todas las búsquedas. Máxima visibilidad para el cliente." },
  { plan: "Profesional", position: "#2", color: "text-purple-600", bg: "bg-purple-50", desc: "Posición mejorada con badge verificado. Aparece antes que Estándar." },
  { plan: "Estándar", position: "#3", color: "text-slate-600", bg: "bg-slate-50", desc: "Posición estándar en los resultados. Visible pero sin destacado." },
];

interface PlanManagerProps {
  tenants: Tenant[];
}

export default function PlanManager({ tenants }: PlanManagerProps) {
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const { config } = useConfigReferidos();

  const precios: Record<string, number> = {
    estandar: Number(config?.precio_plan_estandar ?? 10),
    profesional: Number(config?.precio_plan_profesional ?? 20),
    premium: Number(config?.precio_plan_premium ?? 30),
  };

  const conductoresPorPlan = tenants.reduce<Record<string, number>>((acc, tenant) => {
    if (!tenant.suscripcion_activa) return acc;
    const planId = String(tenant.plan ?? "").toLowerCase();
    acc[planId] = (acc[planId] ?? 0) + 1;
    return acc;
  }, {});

  const displayPlans = plans.map((plan) => ({
    ...plan,
    price: precios[plan.id] ?? plan.price,
    conductores: conductoresPorPlan[plan.id] ?? 0,
  }));

  const handleTogglePlan = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, activo: !p.activo } : p))
    );
  };

  const totalIngresos = displayPlans.reduce((acc, p) => acc + p.price * p.conductores, 0);

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-100" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base lg:text-lg font-black text-slate-900">Gestión de Planes</h2>
            <p className="text-[11px] lg:text-xs text-slate-500 mt-0.5">Administra los planes de suscripción para conductores</p>
          </div>
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-[24px]">workspace_premium</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {displayPlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${plan.gradient} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-[16px] text-white">workspace_premium</span>
              </div>
            </div>
            <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">${plan.price}</span>
            <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">{plan.name} · {plan.conductores} conductores</span>
          </div>
        ))}
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">payments</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-emerald-600 block leading-tight">${totalIngresos.toLocaleString()}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">MRR Total USD</span>
        </div>
      </div>

      {/* Plans detail */}
      <div className="grid lg:grid-cols-3 gap-4">
        {displayPlans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl p-5 border ${plan.activo ? "border-slate-100" : "border-slate-200 opacity-60"}`}
            style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${plan.gradient} text-white flex items-center justify-center shadow-md`}>
                <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  plan.activo ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {plan.activo ? "Activo" : "Inactivo"}
                </span>
                <button
                  onClick={() => handleTogglePlan(plan.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    plan.activo ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    plan.activo ? "left-5" : "left-0.5"
                  }`} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-slate-900">${plan.price}</span>
              <span className="text-[12px] text-slate-400 font-medium">/mes</span>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500">Conductores suscritos</span>
                <span className="text-[13px] font-black text-slate-900">{plan.conductores}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Ingresos mensuales</span>
                <span className="text-[13px] font-black text-emerald-600">${(plan.price * plan.conductores).toLocaleString()}</span>
              </div>
            </div>

            <ul className="space-y-1.5 mb-4">
              {plan.features.slice(0, 5).map((f) => (
                <li key={f.name} className="flex items-start gap-2">
                  <span className={`material-symbols-outlined text-[14px] mt-0.5 ${f.included ? "text-emerald-500" : "text-slate-300"}`}>
                    {f.included ? "check_circle" : "cancel"}
                  </span>
                  <span className={`text-[11px] ${f.included ? "text-slate-600" : "text-slate-400 line-through"}`}>{f.name}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowEditModal(showEditModal === plan.id ? null : plan.id)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-bold active:scale-[0.98] transition hover:bg-slate-200"
            >
              {showEditModal === plan.id ? "Cerrar" : "Editar Plan"}
            </button>

            {showEditModal === plan.id && (
              <div className="mt-3 space-y-2 pt-3 border-t border-slate-100">
                {plan.features.map((f, i) => (
                  <label key={f.name} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.included}
                      onChange={() => {
                        setPlans((prev) =>
                          prev.map((p) =>
                            p.id === plan.id
                              ? {
                                  ...p,
                                  features: p.features.map((feat, j) =>
                                    j === i ? { ...feat, included: !feat.included } : feat
                                  ),
                                }
                              : p
                          )
                        );
                      }}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-600">{f.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Position rules */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Reglas de Posición en Búsqueda</h3>
        <div className="space-y-3">
          {POSITION_RULES.map((rule) => (
            <div key={rule.plan} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`w-10 h-10 rounded-xl ${rule.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm font-black ${rule.color}`}>{rule.position}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-extrabold text-slate-900 block">{rule.plan}</span>
                <span className="text-[11px] text-slate-500">{rule.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position distribution */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Distribución de Conductores por Plan</h3>
        <div className="space-y-3">
          {displayPlans.map((plan) => {
            const total = displayPlans.reduce((a, p) => a + p.conductores, 0);
            const pct = total > 0 ? (plan.conductores / total) * 100 : 0;
            return (
              <div key={plan.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-700">{plan.name}</span>
                  <span className="text-[11px] text-slate-500">{plan.conductores} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${plan.gradient} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
