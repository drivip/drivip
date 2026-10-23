import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AdminMensaje } from "@drivip/types";
import { cn } from "@drivip/ui";

interface DriverSupportCenterProps {
  mensajes: AdminMensaje[];
  loading: boolean;
  error: string | null;
  available: boolean;
  userId: string | null;
  onSend: (contenido: string) => Promise<boolean>;
  onMarcarLeidos: () => void;
}

function hora(iso: string): string {
  try {
    const fecha = new Date(iso);
    const hoy = new Date();
    if (fecha.toDateString() === hoy.toDateString()) {
      return fecha.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
    }
    return fecha.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export default function DriverSupportCenter({
  mensajes,
  loading,
  error,
  available,
  userId,
  onSend,
  onMarcarLeidos,
}: DriverSupportCenterProps) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMarcarLeidos();
  }, [onMarcarLeidos]);

  useEffect(() => {
    if (mensajes.length === 0) return;
    const timer = setTimeout(() => onMarcarLeidos(), 300);
    return () => clearTimeout(timer);
  }, [mensajes.length, onMarcarLeidos]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes.length, loading]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!texto.trim() || enviando || !available) return;
    setEnviando(true);
    const ok = await onSend(texto);
    if (ok) setTexto("");
    setEnviando(false);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-sm">
          <span className="material-symbols-outlined text-[20px]">support_agent</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-black text-slate-900">Drivip Soporte</h2>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Canal directo con el equipo Drivip
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
          Oficial
        </span>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-3">
        {loading && mensajes.length === 0 && (
          <p className="py-8 text-center text-[11px] font-semibold text-slate-400">
            Cargando mensajes...
          </p>
        )}

        {!available && (
          <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <span className="material-symbols-outlined text-[28px] text-amber-500">
              mark_email_unread
            </span>
            <p className="mt-1 text-[12px] font-bold text-amber-800">
              Centro de comunicación en preparación
            </p>
            <p className="mt-1 text-[11px] leading-snug text-amber-700">
              Mientras terminamos la activación, puedes escribirnos a{" "}
              <a href="mailto:soporte@drivip.app" className="font-bold underline">
                soporte@drivip.app
              </a>
              .
            </p>
          </div>
        )}

        {available && !loading && mensajes.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-300">
              forum
            </span>
            <p className="mt-2 text-sm font-bold text-slate-600">Aún no hay mensajes</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Escríbenos una pregunta o solicita soporte. También recibirás aquí los avisos de tu
              suscripción.
            </p>
          </div>
        )}

        {mensajes.map((mensaje) => {
          if (mensaje.emisor_rol === "sistema") {
            return (
              <div key={mensaje.id} className="flex justify-center py-1">
                <div className="max-w-[88%] rounded-2xl border border-purple-100 bg-purple-50 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-purple-600">
                      campaign
                    </span>
                    <p className="text-[11px] font-black text-purple-800">
                      {mensaje.titulo ?? "Aviso de Drivip"}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-purple-700">
                    {mensaje.contenido}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold text-purple-400">
                    {hora(mensaje.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          const esMio = mensaje.emisor_rol === "conductor" || mensaje.emisor_id === userId;

          return (
            <div key={mensaje.id} className={cn("flex", esMio ? "justify-end" : "justify-start")}>
              <div className="max-w-[84%]">
                {!esMio && (
                  <p className="mb-0.5 ml-1 text-[9px] font-black uppercase tracking-wide text-slate-400">
                    Drivip
                  </p>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-[12px] leading-snug shadow-sm",
                    esMio
                      ? "rounded-br-md bg-purple-700 text-white"
                      : "rounded-bl-md bg-white text-slate-800"
                  )}
                >
                  {mensaje.titulo && (
                    <p
                      className={cn(
                        "mb-1 text-[10px] font-black",
                        esMio ? "text-purple-100" : "text-purple-700"
                      )}
                    >
                      {mensaje.titulo}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                  <p
                    className={cn(
                      "mt-1 text-[9px] font-medium",
                      esMio ? "text-purple-200" : "text-slate-400"
                    )}
                  >
                    {hora(mensaje.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <input
          value={texto}
          onChange={(event) => setTexto(event.target.value.slice(0, 2000))}
          placeholder={available ? "Escribe a Drivip..." : "Canal no disponible"}
          disabled={!available}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-purple-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviando || !available}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-700 text-white active:scale-95 disabled:opacity-40"
          aria-label="Enviar mensaje a Drivip"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
      {error && <p className="px-4 pb-2 text-[10px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
