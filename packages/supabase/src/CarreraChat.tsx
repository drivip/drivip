import { useEffect, useRef, useState, type FormEvent } from "react";
import type { MensajeEmisorRol } from "@drivip/types";
import { useMensajesCarrera } from "./useMensajesCarrera";

interface CarreraChatProps {
  carreraId: string;
  rol: MensajeEmisorRol;
  floating?: boolean;
  defaultOpen?: boolean;
}

function hora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function CarreraChat({ carreraId, rol, floating = false, defaultOpen = false }: CarreraChatProps) {
  const { mensajes, userId, loading, error, noLeidos, enviar, marcarLeidos } =
    useMensajesCarrera(carreraId, rol);
  const [open, setOpen] = useState(defaultOpen);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && noLeidos > 0) void marcarLeidos();
  }, [open, noLeidos, marcarLeidos]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, mensajes.length]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const ok = await enviar(texto);
    if (ok) setTexto("");
    setEnviando(false);
  };

  const panel = (
    <div className={floating ? "w-full max-w-sm" : "w-full"}>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-purple-600">chat</span>
            <span className="text-xs font-black text-slate-900">Mensajes</span>
            {noLeidos > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">
                {noLeidos}
              </span>
            )}
          </div>
          {floating && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center active:scale-95"
              aria-label="Cerrar mensajes"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div ref={listRef} className="max-h-56 min-h-24 overflow-y-auto px-3 py-3 space-y-2 bg-white">
          {loading && <p className="text-[11px] text-slate-400 text-center py-4">Cargando mensajes...</p>}
          {!loading && mensajes.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center py-4">
              Escribe para coordinar el viaje con {rol === "cliente" ? "tu conductor" : "tu cliente"}.
            </p>
          )}
          {mensajes.map((mensaje) => {
            const esMio = mensaje.emisor_id === userId;
            return (
              <div key={mensaje.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-snug ${
                    esMio
                      ? "bg-purple-700 text-white rounded-br-md"
                      : "bg-slate-100 text-slate-800 rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                  <p className={`mt-1 text-[9px] font-medium ${esMio ? "text-purple-200" : "text-slate-400"}`}>
                    {mensaje.emisor_rol === "conductor" ? "Conductor" : "Cliente"} - {hora(mensaje.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-100 p-2 flex items-center gap-2 bg-white">
          <input
            value={texto}
            onChange={(event) => setTexto(event.target.value.slice(0, 1000))}
            placeholder="Escribe un mensaje..."
            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="w-9 h-9 flex-shrink-0 rounded-xl bg-purple-700 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
            aria-label="Enviar mensaje"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
        {error && <p className="px-3 pb-2 text-[10px] text-red-500">{error}</p>}
      </div>
    </div>
  );

  if (!floating) {
    if (open) return panel;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2.5 text-slate-700 active:scale-[0.99] transition"
      >
        <span className="flex items-center gap-2 text-xs font-bold">
          <span className="material-symbols-outlined text-[17px] text-purple-600">chat</span>
          Mensajes
        </span>
        {noLeidos > 0 ? (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">
            {noLeidos}
          </span>
        ) : (
          <span className="material-symbols-outlined text-[17px] text-slate-400">expand_less</span>
        )}
      </button>
    );
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 left-4 z-40 h-11 px-3 rounded-full bg-white shadow-xl border border-slate-200 flex items-center gap-1.5 text-slate-800 active:scale-95 transition"
          aria-label="Abrir mensajes"
        >
          <span className="material-symbols-outlined text-[20px] text-purple-600">chat</span>
          <span className="text-[11px] font-black">Mensajes</span>
          {noLeidos > 0 && (
            <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">
              {noLeidos}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm">{panel}</div>
        </div>
      )}
    </>
  );
}
