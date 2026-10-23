import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ConversacionConductor } from "@drivip/types";
import { useMensajesDirectos } from "@drivip/supabase";
import { useScrollLock } from "../../hooks/useScrollLock";

interface DriverMessageCenterProps {
  isOpen: boolean;
  onClose: () => void;
  conversaciones: ConversacionConductor[];
  loading: boolean;
  userId: string | null;
  onMarcarLeida: (conversacionId: string) => void;
  onRefetch: () => void;
  onOpenSupport: () => void;
  soporteUnread: number;
  soporteUltimoMensaje: string | null;
  soporteUltimoAt: string | null;
  embedded?: boolean;
  initialConversationId?: string | null;
}

function hora(iso: string | null): string {
  if (!iso) return "";
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

function initials(nombre: string): string {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "C"
  );
}

export default function DriverMessageCenter({
  isOpen,
  onClose,
  conversaciones,
  loading,
  userId,
  onMarcarLeida,
  onRefetch,
  onOpenSupport,
  soporteUnread,
  soporteUltimoMensaje,
  soporteUltimoAt,
  embedded = false,
  initialConversationId = null,
}: DriverMessageCenterProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useScrollLock(!embedded && isOpen);

  const seleccionada = conversaciones.find((item) => item.conversacion_id === selectedId) ?? null;
  const { mensajes, userId: chatUserId, loading: chatLoading, error, enviar, marcarLeidos } =
    useMensajesDirectos(selectedId, "conductor", seleccionada?.ultima_carrera_id ?? null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null);
      setTexto("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialConversationId) setSelectedId(initialConversationId);
  }, [isOpen, initialConversationId]);

  useEffect(() => {
    if (!selectedId) return;
    onMarcarLeida(selectedId);
    void marcarLeidos();
  }, [selectedId, onMarcarLeida, marcarLeidos]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = setTimeout(() => { void marcarLeidos(); }, 250);
    return () => clearTimeout(timer);
  }, [selectedId, mensajes.length, marcarLeidos]);

  useEffect(() => {
    if (!selectedId) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selectedId, mensajes.length]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const ok = await enviar(texto);
    if (ok) {
      setTexto("");
      onRefetch();
    }
    setEnviando(false);
  };

  const panel = (
      <div
        className={
          embedded
            ? "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white"
            : "relative flex h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[80dvh] sm:rounded-3xl"
        }
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          {selectedId ? (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
              aria-label="Volver a conversaciones"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <span className="material-symbols-outlined text-[20px]">forum</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black text-slate-900">
              {seleccionada?.cliente_nombre ?? "Mensajes"}
            </h2>
            <p className="text-[10px] font-semibold text-slate-500">
              {seleccionada?.cliente_telefono ?? "Conversaciones con tus clientes"}
            </p>
          </div>

          {seleccionada?.cliente_telefono && (
            <a
              href={`tel:${seleccionada.cliente_telefono}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 active:scale-95"
              aria-label="Llamar al cliente"
            >
              <span className="material-symbols-outlined text-[19px]">call</span>
            </a>
          )}

          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
              aria-label="Cerrar mensajes"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {!selectedId ? (
          <div className="flex-1 overflow-y-auto p-3">
            {loading && (
              <p className="py-10 text-center text-xs font-semibold text-slate-400">
                Cargando conversaciones...
              </p>
            )}

            {!loading && conversaciones.length === 0 && (
              <div className="flex flex-col items-center justify-center px-8 py-6 text-center">
                <span className="material-symbols-outlined text-[38px] text-slate-300">mark_chat_unread</span>
                <p className="mt-2 text-sm font-bold text-slate-600">Aún no tienes conversaciones con clientes</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Cuando un cliente te escriba o aceptes un servicio, la conversación aparecerá aquí.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenSupport}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-700 p-3 text-left text-white transition active:scale-[0.99]"
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <span className="material-symbols-outlined text-[22px]">support_agent</span>
                  {soporteUnread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-rose-500 px-1 text-[9px] font-black text-white">
                      {soporteUnread > 9 ? "9+" : soporteUnread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black">Drivip Soporte</p>
                    <span className="shrink-0 text-[9px] font-semibold text-slate-300">
                      {hora(soporteUltimoAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-200">
                    {soporteUltimoMensaje ?? "Canal oficial · avisos y soporte"}
                  </p>
                </div>
              </button>

              {conversaciones.map((conversacion) => {
                const activa = conversacion.conversacion_id === selectedId;
                return (
                  <button
                    key={conversacion.conversacion_id}
                    type="button"
                    onClick={() => setSelectedId(conversacion.conversacion_id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                      activa ? "border-purple-200 bg-purple-50" : "border-slate-100 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-xs font-black text-white">
                      {initials(conversacion.cliente_nombre)}
                      {conversacion.no_leidos > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white">
                          {conversacion.no_leidos}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-black text-slate-900">
                          {conversacion.cliente_nombre}
                        </p>
                        <span className="shrink-0 text-[9px] font-semibold text-slate-400">
                          {hora(conversacion.ultimo_mensaje_at)}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-[11px] ${
                          conversacion.no_leidos > 0 ? "font-bold text-slate-800" : "text-slate-500"
                        }`}
                      >
                        {conversacion.ultimo_mensaje ?? "Conversación iniciada"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-3">
              {chatLoading && (
                <p className="py-8 text-center text-[11px] font-semibold text-slate-400">
                  Cargando mensajes...
                </p>
              )}
              {!chatLoading && mensajes.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-[38px] text-slate-300">chat_bubble</span>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">
                    Escribe el primer mensaje a {seleccionada?.cliente_nombre ?? "tu cliente"}.
                  </p>
                </div>
              )}
              {mensajes.map((mensaje) => {
                const esMio = mensaje.emisor_id === (chatUserId ?? userId);
                return (
                  <div key={mensaje.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[84%] rounded-2xl px-3 py-2 text-[12px] leading-snug shadow-sm ${
                        esMio
                          ? "rounded-br-md bg-purple-700 text-white"
                          : "rounded-bl-md bg-white text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                      <p className={`mt-1 text-[9px] font-medium ${esMio ? "text-purple-200" : "text-slate-400"}`}>
                        {hora(mensaje.created_at)}
                      </p>
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
                onChange={(event) => setTexto(event.target.value.slice(0, 1000))}
                placeholder="Escribe un mensaje..."
                className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                disabled={!texto.trim() || enviando}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-700 text-white active:scale-95 disabled:opacity-40"
                aria-label="Enviar mensaje"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
            {error && <p className="px-4 pb-2 text-[10px] font-semibold text-rose-600">{error}</p>}
          </>
        )}
      </div>
  );

  if (embedded) return panel;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      {panel}
    </div>
  );
}
