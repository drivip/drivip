import { useState } from "react";
import { PushNotificationCard, useAuthContext } from "@drivip/supabase";

interface Toggle {
  label: string;
  checked: boolean;
}

interface ConfiguracionProps {
  isPaused?: boolean;
  tenantId?: string | null;
}

export default function Configuracion({ isPaused, tenantId }: ConfiguracionProps) {
  const { signOut } = useAuthContext();
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

  const toggleNotif = (idx: number) => {
    if (isPaused) return;
    setNotifToggles(notifToggles.map((t, i) => i === idx ? { ...t, checked: !t.checked } : t));
  };
  const toggleGeneral = (idx: number) => {
    if (isPaused) return;
    setGeneralToggles(generalToggles.map((t, i) => i === idx ? { ...t, checked: !t.checked } : t));
  };

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
    </div>
  );
}
