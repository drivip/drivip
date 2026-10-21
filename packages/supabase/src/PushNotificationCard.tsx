import { usePushNotifications } from "./usePushNotifications";

interface PushNotificationCardProps {
  tenantId?: string | null;
  disabled?: boolean;
}

export function PushNotificationCard({ tenantId, disabled }: PushNotificationCardProps) {
  const { supported, permission, subscribed, loading, error, enable, disable } =
    usePushNotifications({ tenantId });

  if (!supported) {
    return (
      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100">
        <p className="text-sm font-bold text-slate-900">Notificaciones Push</p>
        <p className="text-[11px] text-slate-500 mt-1">Tu navegador no soporta notificaciones push.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-purple-600">notifications_active</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">Notificaciones Push</p>
            <p className="line-clamp-2 text-[11px] leading-tight text-slate-500">
              {subscribed
                ? "Activadas en este dispositivo"
                : permission === "denied"
                  ? "Permiso bloqueado en el navegador"
                  : "Recibe avisos aun con la app cerrada"}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-pressed={subscribed}
          onClick={() => (subscribed ? disable() : enable())}
          disabled={loading || disabled}
          className={`w-12 h-6 shrink-0 rounded-full transition-colors relative ${
            loading || disabled ? "bg-slate-200" : subscribed ? "bg-purple-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              subscribed ? "left-[26px]" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-2">{error}</p>}
      {permission === "denied" && (
        <p className="text-[11px] text-amber-600 mt-2">
          Habilita las notificaciones desde la configuracion del navegador.
        </p>
      )}
    </div>
  );
}
