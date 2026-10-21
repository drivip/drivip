import { useEffect, useState } from "react";
import type { Driver } from "../../types/passenger";
import { useScrollLock } from "../../hooks/useScrollLock";

interface DriverMessageModalProps {
  driver: Driver | null;
  onClose: () => void;
  onSent: (message: string) => void;
}

const QUICK_MESSAGES = [
  "¿Estás disponible ahora?",
  "Voy saliendo, te espero en la entrada.",
  "¿Cuánto cobras hasta mi destino?",
  "Gracias, ya te confirmo.",
];

export default function DriverMessageModal({ driver, onClose, onSent }: DriverMessageModalProps) {
  const [message, setMessage] = useState("");
  useScrollLock(Boolean(driver));

  useEffect(() => {
    if (driver) setMessage("");
  }, [driver]);

  if (!driver) return null;

  const digits = driver.whatsapp.replace(/\D/g, "");
  const canSend = message.trim().length > 0 && digits.length >= 7;

  const handleSend = () => {
    if (!canSend) return;
    const text = encodeURIComponent(message.trim());
    window.open(`https://wa.me/${digits}?text=${text}`, "_blank", "noopener,noreferrer");
    onSent(message.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[125] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar mensaje"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-t-[30px] border border-white/80 bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[30px]">
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-gradient-to-r from-slate-900 to-purple-900 px-4 py-3.5 text-white">
          <div className="relative shrink-0">
            {driver.image ? (
              <img alt={driver.name} src={driver.image} className="h-11 w-11 rounded-2xl border-2 border-white/20 object-cover" />
            ) : (
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-base font-black text-white ${driver.color}`}>
                {driver.initials}
              </span>
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${driver.status === "available" ? "bg-emerald-400" : "bg-amber-400"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{driver.name}</p>
            <p className="truncate text-[11px] font-semibold text-white/60">
              {driver.vehicle} · {driver.availability}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="mb-4 flex gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <span className="material-symbols-outlined text-[19px] text-emerald-600">verified_user</span>
            <p className="text-[11px] font-semibold leading-relaxed text-emerald-800">
              El mensaje se envía por WhatsApp para que tu conductor lo reciba al instante.
            </p>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_MESSAGES.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setMessage(quick)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600 active:scale-95"
              >
                {quick}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder="Escribe tu mensaje..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="material-symbols-outlined text-[19px]">send</span>
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
