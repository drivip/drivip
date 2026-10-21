import { useEffect, useMemo, useState } from "react";
import { supabase, useAuthContext } from "@drivip/supabase";
import { VENEZUELA_STATES } from "@drivip/maps";
import { useScrollLock } from "../../hooks/useScrollLock";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessagesClick: () => void;
  unreadMessages?: number;
}

type ModalView = "menu" | "password" | "account";

interface Feedback {
  type: "success" | "error";
  text: string;
}

const inputClass =
  "w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200";
const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wider";

export default function AuthModal({
  isOpen,
  onClose,
  onMessagesClick,
  unreadMessages = 0,
}: AuthModalProps) {
  const { user, signOut } = useAuthContext();
  const [view, setView] = useState<ModalView>("menu");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [account, setAccount] = useState({
    nombre: "",
    telefono: "",
    estado: "",
    ciudad: "",
  });

  const passengerName =
    (user?.user_metadata?.nombre as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "Cliente";
  const profileInitial = user?.email?.charAt(0)?.toUpperCase() ?? "U";

  const ciudades = useMemo(
    () => VENEZUELA_STATES.find((estado) => estado.nombre === account.estado)?.ciudades ?? [],
    [account.estado],
  );

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setView("menu");
    setFeedback(null);
    setPasswords({ next: "", confirm: "" });
    setAccount({
      nombre: (user?.user_metadata?.nombre as string | undefined) ?? "",
      telefono: (user?.user_metadata?.telefono as string | undefined) ?? "",
      estado: (user?.user_metadata?.estado as string | undefined) ?? "",
      ciudad: (user?.user_metadata?.ciudad as string | undefined) ?? "",
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const updateAccount = (field: keyof typeof account, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }));
  };

  const updateEstado = (estado: string) => {
    const ciudad = VENEZUELA_STATES.find((item) => item.nombre === estado)?.ciudades[0] ?? "";
    setAccount((prev) => ({ ...prev, estado, ciudad }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (passwords.next.length < 6) {
      setFeedback({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setFeedback({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setSaving(false);

    if (error) {
      setFeedback({ type: "error", text: error.message });
      return;
    }

    setPasswords({ next: "", confirm: "" });
    setFeedback({ type: "success", text: "Contraseña actualizada correctamente." });
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);

    if (!account.nombre.trim()) {
      setFeedback({ type: "error", text: "El nombre no puede estar vacío." });
      return;
    }

    setSaving(true);

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        nombre: account.nombre.trim(),
        telefono: account.telefono.trim(),
        estado: account.estado,
        ciudad: account.ciudad,
      },
    });

    if (authError) {
      setSaving(false);
      setFeedback({ type: "error", text: authError.message });
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        nombre: account.nombre.trim(),
        telefono: account.telefono.trim(),
        estado: account.estado,
        ciudad: account.ciudad,
      })
      .eq("id", user.id);

    setSaving(false);

    if (profileError) {
      setFeedback({ type: "error", text: "Datos guardados, pero no se pudo actualizar el perfil." });
      return;
    }

    setFeedback({ type: "success", text: "Datos actualizados correctamente." });
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/70 backdrop-blur-sm" data-purpose="auth-modal" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-4 sm:space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del perfil */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-base font-black text-purple-700">
              {profileInitial}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm sm:text-base lg:text-lg font-black text-slate-900">{passengerName}</h3>
              <p className="truncate text-[11px] sm:text-xs font-semibold text-slate-400">{user?.email ?? "Pasajero VIP"}</p>
            </div>
          </div>
          <button
            aria-label="Cerrar"
            className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {view === "menu" && (
          <>
            {/* Centro de Mensajes */}
            <button
              type="button"
              aria-label="Abrir centro de mensajes"
              data-purpose="messages-button"
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition active:scale-[0.98]"
              onClick={() => {
                onClose();
                onMessagesClick();
              }}
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/25">
                <span className="material-symbols-outlined text-[22px]">forum</span>
                {unreadMessages > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-black leading-none text-white">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-black text-slate-900">Centro de mensajes</strong>
                <span className="block truncate text-[11px] font-semibold text-slate-500">
                  {unreadMessages > 0
                    ? `${unreadMessages} mensaje${unreadMessages === 1 ? "" : "s"} sin leer`
                    : "Conversaciones con tus conductores"}
                </span>
              </span>
              <span className="material-symbols-outlined text-[20px] text-slate-400">chevron_right</span>
            </button>

            {/* Configuración */}
            <div className="space-y-2">
              <h4 className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Configuración</h4>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition active:scale-[0.98]"
                onClick={() => { setFeedback(null); setView("password"); }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-bold text-slate-900">Editar contraseña</strong>
                  <span className="block truncate text-[11px] font-semibold text-slate-500">Actualiza tu clave de acceso</span>
                </span>
                <span className="material-symbols-outlined text-[20px] text-slate-400">chevron_right</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition active:scale-[0.98]"
                onClick={() => { setFeedback(null); setView("account"); }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-bold text-slate-900">Gestión de usuario</strong>
                  <span className="block truncate text-[11px] font-semibold text-slate-500">Datos personales y ubicación</span>
                </span>
                <span className="material-symbols-outlined text-[20px] text-slate-400">chevron_right</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-left transition active:scale-[0.98]"
                onClick={() => void handleSignOut()}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </span>
                <strong className="min-w-0 flex-1 text-sm font-bold text-red-600">Cerrar sesión</strong>
              </button>
            </div>
          </>
        )}

        {view === "password" && (
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Volver"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 active:scale-95"
                onClick={() => { setFeedback(null); setView("menu"); }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h4 className="text-sm sm:text-base font-black text-slate-900">Editar contraseña</h4>
            </div>

            <div>
              <label className={labelClass} htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
                value={passwords.next}
                onChange={(e) => setPasswords((prev) => ({ ...prev, next: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="confirm-password">Confirmar contraseña</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="Repite la contraseña"
                value={passwords.confirm}
                onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
              />
            </div>

            {feedback && (
              <p className={`text-[12px] font-semibold ${feedback.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                {feedback.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold shadow-md active:scale-95 transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}

        {view === "account" && (
          <form className="space-y-4" onSubmit={handleAccountSubmit}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Volver"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 active:scale-95"
                onClick={() => { setFeedback(null); setView("menu"); }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h4 className="text-sm sm:text-base font-black text-slate-900">Gestión de usuario</h4>
            </div>

            <div>
              <label className={labelClass} htmlFor="account-email">Correo</label>
              <input
                id="account-email"
                type="email"
                className={`${inputClass} opacity-60`}
                value={user?.email ?? ""}
                disabled
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="account-name">Nombre completo</label>
              <input
                id="account-name"
                type="text"
                className={inputClass}
                placeholder="Tu nombre"
                value={account.nombre}
                onChange={(e) => updateAccount("nombre", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="account-phone">Teléfono</label>
              <input
                id="account-phone"
                type="tel"
                className={inputClass}
                placeholder="412 123 4567"
                value={account.telefono}
                onChange={(e) => updateAccount("telefono", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="account-state">Estado</label>
                <select
                  id="account-state"
                  className={inputClass}
                  value={account.estado}
                  onChange={(e) => updateEstado(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {VENEZUELA_STATES.map((estado) => (
                    <option key={estado.nombre} value={estado.nombre}>{estado.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="account-city">Ciudad</label>
                <select
                  id="account-city"
                  className={inputClass}
                  value={account.ciudad}
                  onChange={(e) => updateAccount("ciudad", e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad} value={ciudad}>{ciudad}</option>
                  ))}
                </select>
              </div>
            </div>

            {feedback && (
              <p className={`text-[12px] font-semibold ${feedback.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                {feedback.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold shadow-md active:scale-95 transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
