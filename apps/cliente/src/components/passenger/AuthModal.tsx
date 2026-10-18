import { useState } from "react";
import { useScrollLock } from "../../hooks/useScrollLock";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phone: string) => void;
}

export default function AuthModal({ isOpen, onClose, onConfirm }: AuthModalProps) {
  const [phone, setPhone] = useState("");

  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/70 backdrop-blur-sm" data-purpose="auth-modal" onClick={onClose}>
      <div className="bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-4 sm:space-y-5 lg:space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-900">Acceso Rápido Pasajero</h3>
          <button className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95" onClick={onClose}>✕</button>
        </div>
        <p className="text-xs sm:text-sm lg:text-base text-slate-500">Ingresa tu número celular venezolano (+58) para sincronizar tus viajes directos.</p>
        <div className="flex rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
          <span className="px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 bg-slate-100 font-bold text-xs sm:text-sm lg:text-base text-slate-700 border-r border-slate-200 flex items-center gap-1">
            🇻🇪 +58
          </span>
          <input
            className="w-full bg-transparent border-0 text-xs sm:text-sm lg:text-base font-bold text-slate-900 px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 focus:ring-0"
            placeholder="412 123 4567"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button
          className="w-full py-3 sm:py-3.5 lg:py-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm lg:text-base font-bold shadow-md active:scale-95 transition"
          onClick={() => onConfirm(phone || "4121234567")}
        >
          Recibir Código WhatsApp / SMS
        </button>
      </div>
    </div>
  );
}
