import { useState } from "react";
import type { Tenant } from "@drivip/types";
import { PushNotificationCard, useAuthContext } from "@drivip/supabase";
import { useScrollLock } from "../hooks/useScrollLock";
import MisPrecios from "./MisPrecios";
import CouponsManager from "./CouponsManager";
import PaymentMethodsSetup from "./driver/PaymentMethodsSetup";

interface Toggle {
  label: string;
  checked: boolean;
}

interface ConfiguracionProps {
  isPaused?: boolean;
  tenantId?: string | null;
  tenant?: Tenant | null;
  demo?: boolean;
  onSaved?: () => void;
}

type ServicePanel = "tarifas" | "cupones" | "pagos" | null;

const SERVICE_OPTIONS: {
  id: Exclude<ServicePanel, null>;
  label: string;
  desc: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "tarifas",
    label: "Precios y tarifas",
    desc: "Por kilómetro o por zona",
    icon: "route",
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "cupones",
    label: "Cupones y descuentos",
    desc: "Códigos promocionales",
    icon: "confirmation_number",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "pagos",
    label: "Métodos de pago",
    desc: "Pago Móvil, Zelle y efectivo",
    icon: "payments",
    color: "from-emerald-500 to-teal-600",
  },
];

export default function Configuracion({
  isPaused,
  tenantId,
  tenant,
  demo = false,
  onSaved,
}: ConfiguracionProps) {
  const { signOut } = useAuthContext();
  const [panel, setPanel] = useState<ServicePanel>(null);
  const [notifToggles, setNotifToggles] = useState<Toggle[]>([
    { label: "Nueva carrera", checked: true },
    { label: "Mensajes del cliente", checked: true },
    { label: "Pagos recibidos", checked: true },
    { label: "Viajes programados", checked: false },
  ]);
  const [generalToggles, setGeneralToggles] = useState<Toggle[]>([
    { label: "Ubicacion en tiempo real", checked: true },
    { label: "Modo oscuro", checked: false },
    { label: "Sonidos de alerta", checked: true },
  ]);

  useScrollLock(Boolean(panel));

  const toggleNotif = (idx: number) => {
    if (isPaused) return;
    setNotifToggles(notifToggles.map((t, i) => i === idx ? { ...t, checked: !t.checked } : t));
  };
  const toggleGeneral = (idx: number) => {
    if (isPaused) return;
    setGeneralToggles(generalToggles.map((t, i) => i === idx ? { ...t, checked: !t.checked } : t));
  };

  const panelTitle =
    panel === "tarifas"
      ? "Precios y tarifas"
      : panel === "cupones"
        ? "Cupones y descuentos"
        : "Métodos de pago";

  const modoTarifa = tenant?.tarifa_modo === "zona" ? "Zona fija" : "Por kilómetro";

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Configuracion</h1>

      {isPaused && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-amber-600 mt-0.5">pause_circle</span>
          <div>
            <p className="text-[12px] font-bold text-amber-800">Cuenta pausada</p>
            <p className="text-[11px] text-amber-600 mt-0.5">El administrador ha pausado tu cuenta. Las configuraciones estan bloqueadas temporalmente.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-2">
        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servicio y cobros</p>
        {SERVICE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPanel(option.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left active:scale-[0.99] transition"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${option.color} text-white shadow-md`}>
              <span className="material-symbols-outlined text-[19px]">{option.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-black text-slate-900">{option.label}</p>
              <p className="text-[10px] lg:text-[11px] font-semibold text-slate-500">
                {option.id === "tarifas" ? `${option.desc} · ${modoTarifa}` : option.desc}
              </p>
            </div>
            <span className="material-symbols-outlined text-[19px] text-slate-400">chevron_right</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-1">
        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notificaciones</p>
        {notifToggles.map((t, idx) => (
          <div key={t.label} className="flex items-center justify-between py-3 px-1 border-b border-slate-100 last:border-0">
            <span className={`text-sm lg:text-base ${isPaused ? "text-slate-400" : "text-slate-900"}`}>{t.label}</span>
            <button
              onClick={() => toggleNotif(idx)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isPaused ? "bg-slate-200" : t.checked ? 'bg-purple-600' : 'bg-slate-300'}`}
              disabled={isPaused}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${t.checked ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <PushNotificationCard disabled={isPaused} tenantId={tenantId} />

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-1">
        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">General</p>
        {generalToggles.map((t, idx) => (
          <div key={t.label} className="flex items-center justify-between py-3 px-1 border-b border-slate-100 last:border-0">
            <span className={`text-sm lg:text-base ${isPaused ? "text-slate-400" : "text-slate-900"}`}>{t.label}</span>
            <button
              onClick={() => toggleGeneral(idx)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isPaused ? "bg-slate-200" : t.checked ? 'bg-purple-600' : 'bg-slate-300'}`}
              disabled={isPaused}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${t.checked ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-2">
        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Control de Horarios</p>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-purple-600">schedule</span>
            <span className="text-sm font-medium text-slate-900">Turno Activo</span>
          </div>
          <span className="text-xs font-bold text-emerald-600">06:00 - 18:00</span>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600">coffee</span>
            <span className="text-sm font-medium text-slate-900">Modo Pausa</span>
          </div>
          <span className="text-xs font-bold text-amber-600">{isPaused ? "Pausado" : "Inactivo"}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100">
        <button
          onClick={() => { void signOut(); }}
          className="w-full py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-bold text-sm active:scale-[0.98] transition"
        >
          Cerrar Sesion
        </button>
      </div>

      {panel && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setPanel(null)}
          />

          <div className="relative flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#f1f4f8] shadow-2xl sm:h-[86dvh] sm:rounded-3xl">
            <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <span className="material-symbols-outlined text-[20px]">
                  {panel === "tarifas" ? "route" : panel === "cupones" ? "confirmation_number" : "payments"}
                </span>
              </div>
              <h2 className="min-w-0 flex-1 truncate text-sm font-black text-slate-900">
                {panelTitle}
              </h2>
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
                aria-label="Cerrar configuración"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {panel === "tarifas" && (
                <MisPrecios tenant={tenant} demo={demo} onSaved={onSaved} />
              )}
              {panel === "cupones" && (
                <CouponsManager
                  tenantId={tenantId}
                  demo={demo}
                  conductorNombre={tenant?.nombre}
                />
              )}
              {panel === "pagos" && (
                <PaymentMethodsSetup
                  inline
                  tenant={tenant}
                  tenantId={tenantId}
                  demo={demo}
                  onSaved={onSaved}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
