import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMensajesDirectos } from "@drivip/supabase";
import type { ConversacionCliente, MensajeDirecto } from "@drivip/types";
import type { Driver } from "../../types/passenger";
import { useScrollLock } from "../../hooks/useScrollLock";

interface MessageCenterProps {
  open: boolean;
  onClose: () => void;
  drivers: Driver[];
  conversaciones: ConversacionCliente[];
  userId: string | null;
  loading: boolean;
  error: string | null;
  initialTarget: { conversationId: string; tenantId: string } | null;
  onEnsureConversation: (tenantId: string) => Promise<string | null>;
  onMarkRead: (conversationId: string) => Promise<void> | void;
}

interface ConversationEntry {
  tenantId: string;
  driver: Driver | undefined;
  conversation: ConversacionCliente | null;
  name: string;
  sortAt: number;
}

function hora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function fechaLista(iso: string | null): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  const hoy = new Date();
  if (fecha.toDateString() === hoy.toDateString()) return hora(iso);
  return fecha.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
}

function fechaSeparador(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
  return fecha.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function mismoDia(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "C";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export default function MessageCenter({
  open,
  onClose,
  drivers,
  conversaciones,
  userId,
  loading,
  error,
  initialTarget,
  onEnsureConversation,
  onMarkRead,
}: MessageCenterProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [driverFilter, setDriverFilter] = useState("all");
  const [startingTenantId, setStartingTenantId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setSelectedTenantId(null);
      setSearch("");
      setOnlyUnread(false);
      setDriverFilter("all");
      setTexto("");
    }
  }, [open]);

  useEffect(() => {
    if (open && initialTarget) {
      setSelectedId(initialTarget.conversationId);
      setSelectedTenantId(initialTarget.tenantId);
    }
  }, [open, initialTarget]);

  const driverById = useMemo(() => new Map(drivers.map((driver) => [driver.id, driver])), [drivers]);

  const entries = useMemo<ConversationEntry[]>(() => {
    const withConversation = conversaciones.map((conversation) => {
      const driver = driverById.get(conversation.tenant_id);
      return {
        tenantId: conversation.tenant_id,
        driver,
        conversation,
        name: driver?.name ?? "Conductor",
        sortAt: conversation.ultimo_mensaje_at
          ? new Date(conversation.ultimo_mensaje_at).getTime()
          : 0,
      };
    });

    const withoutConversation = drivers
      .filter((driver) => !conversaciones.some((conversation) => conversation.tenant_id === driver.id))
      .map((driver) => ({
        tenantId: driver.id,
        driver,
        conversation: null,
        name: driver.name,
        sortAt: 0,
      }));

    return [...withConversation, ...withoutConversation].sort((a, b) => {
      if (a.sortAt !== b.sortAt) return b.sortAt - a.sortAt;
      return a.name.localeCompare(b.name, "es");
    });
  }, [conversaciones, drivers, driverById]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (driverFilter !== "all" && entry.tenantId !== driverFilter) return false;
      if (onlyUnread && !(entry.conversation?.no_leidos ?? 0)) return false;
      if (!term) return true;
      return (
        entry.name.toLowerCase().includes(term) ||
        (entry.conversation?.ultimo_mensaje ?? "").toLowerCase().includes(term)
      );
    });
  }, [entries, driverFilter, onlyUnread, search]);

  const selectedConversation = useMemo(
    () => conversaciones.find((conversation) => conversation.conversacion_id === selectedId) ?? null,
    [conversaciones, selectedId]
  );

  const selectedDriver = selectedTenantId ? driverById.get(selectedTenantId) : undefined;
  const selectedName = selectedDriver?.name ?? "Conductor";

  const {
    mensajes,
    userId: chatUserId,
    loading: messagesLoading,
    error: messagesError,
    enviar,
  } = useMensajesDirectos(
    selectedId,
    "cliente",
    selectedConversation?.ultima_carrera_id ?? null
  );

  useEffect(() => {
    if (open && selectedId) void onMarkRead(selectedId);
  }, [open, selectedId, onMarkRead]);

  useEffect(() => {
    if (!selectedId) return;
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [selectedId, mensajes.length, messagesLoading]);

  if (!open) return null;

  const handleSelect = async (entry: ConversationEntry) => {
    let conversationId = entry.conversation?.conversacion_id ?? null;
    if (!conversationId) {
      setStartingTenantId(entry.tenantId);
      conversationId = await onEnsureConversation(entry.tenantId);
      setStartingTenantId(null);
      if (!conversationId) return;
    }
    setSelectedId(conversationId);
    setSelectedTenantId(entry.tenantId);
    setTexto("");
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const ok = await enviar(texto);
    if (ok) setTexto("");
    setEnviando(false);
  };

  const renderBubble = (mensaje: MensajeDirecto, indice: number) => {
    const anterior = indice > 0 ? mensajes[indice - 1] : null;
    const mostrarFecha = !anterior || !mismoDia(anterior.created_at, mensaje.created_at);
    const esMio = mensaje.emisor_id === (chatUserId ?? userId);

    return (
      <div key={mensaje.id}>
        {mostrarFecha && (
          <div className="my-3 flex justify-center">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-slate-500 shadow-sm">
              {fechaSeparador(mensaje.created_at)}
            </span>
          </div>
        )}
        <div className={`mb-1.5 flex ${esMio ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[82%] rounded-xl px-3 py-2 text-[13px] leading-snug shadow-sm ${
              esMio
                ? "rounded-tr-none bg-[#d9fdd3] text-slate-800"
                : "rounded-tl-none bg-white text-slate-800"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-[9px] font-semibold text-slate-400">
              {hora(mensaje.created_at)}
              {esMio && (
                <span className="material-symbols-outlined text-[13px] text-sky-500">done_all</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[140] flex sm:items-end sm:justify-end sm:p-6" role="dialog" aria-modal="true" aria-label="Centro de mensajes">
      <button
        type="button"
        aria-label="Cerrar mensajes"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[min(860px,calc(100vw-3rem))] sm:rounded-[28px] sm:border sm:border-white/80">
        <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-purple-900 px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <span className="material-symbols-outlined text-[21px]">forum</span>
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black">Mensajes</h2>
              <p className="truncate text-[11px] font-semibold text-white/60">
                Tus conversaciones con conductores
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside
            className={`min-h-0 w-full flex-col border-r border-slate-200 bg-slate-50/80 sm:flex sm:w-[320px] ${
              selectedId ? "hidden sm:flex" : "flex"
            }`}
          >
            <div className="shrink-0 space-y-2 border-b border-slate-200/80 p-3">
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  search
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar conductor o mensaje..."
                  aria-label="Buscar conversación"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={driverFilter}
                  onChange={(event) => setDriverFilter(event.target.value)}
                  aria-label="Filtrar por conductor"
                  className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 outline-none focus:border-purple-300"
                >
                  <option value="all">Todos los conductores</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setOnlyUnread((value) => !value)}
                  aria-pressed={onlyUnread}
                  className={`h-9 shrink-0 rounded-xl border px-3 text-[11px] font-bold transition ${
                    onlyUnread
                      ? "border-purple-600 bg-purple-700 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  No leídos
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading && (
                <p className="p-5 text-center text-[12px] font-semibold text-slate-400">
                  Cargando conversaciones...
                </p>
              )}
              {!loading && error && (
                <p className="p-5 text-center text-[12px] font-semibold text-red-500">{error}</p>
              )}
              {!loading && !error && filteredEntries.length === 0 && (
                <div className="p-6 text-center">
                  <span className="material-symbols-outlined text-[36px] text-slate-300">mark_chat_unread</span>
                  <p className="mt-2 text-[12px] font-bold text-slate-500">No hay conversaciones</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Agrega un conductor o cambia los filtros.
                  </p>
                </div>
              )}
              {filteredEntries.map((entry) => {
                const unread = entry.conversation?.no_leidos ?? 0;
                const last = entry.conversation?.ultimo_mensaje;
                const prefix = entry.conversation?.ultimo_emisor_id === userId ? "Tú: " : "";
                const selected = entry.conversation?.conversacion_id === selectedId || entry.tenantId === selectedTenantId;
                const driver = entry.driver;
                return (
                  <button
                    key={entry.tenantId}
                    type="button"
                    onClick={() => void handleSelect(entry)}
                    disabled={startingTenantId === entry.tenantId}
                    className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition active:bg-slate-100 disabled:opacity-60 ${
                      selected ? "bg-purple-50/90" : "bg-white/70 hover:bg-white"
                    }`}
                  >
                    <span className="relative shrink-0">
                      {driver?.image ? (
                        <img alt={entry.name} src={driver.image} className="h-12 w-12 rounded-2xl object-cover" />
                      ) : (
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black text-white ${driver?.color ?? "bg-gradient-to-br from-purple-500 to-indigo-600"}`}>
                          {iniciales(entry.name)}
                        </span>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        driver?.status === "available" ? "bg-emerald-500" : "bg-slate-300"
                      }`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-black text-slate-900">{entry.name}</span>
                        <span className={`shrink-0 text-[10px] font-semibold ${unread ? "text-purple-600" : "text-slate-400"}`}>
                          {fechaLista(entry.conversation?.ultimo_mensaje_at ?? null)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={`truncate text-[11px] ${unread ? "font-bold text-slate-700" : "font-medium text-slate-400"}`}>
                          {last ? `${prefix}${last}` : startingTenantId === entry.tenantId ? "Abriendo conversación..." : "Sin mensajes todavía"}
                        </span>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-purple-600 px-1.5 text-[10px] font-black text-white">
                            {unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className={`min-h-0 min-w-0 flex-1 flex-col ${selectedId ? "flex" : "hidden sm:flex"}`}>
            {selectedId ? (
              <>
                <div className="flex shrink-0 items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedTenantId(null);
                    }}
                    aria-label="Volver a conversaciones"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 active:scale-95 sm:hidden"
                  >
                    <span className="material-symbols-outlined text-[21px]">arrow_back</span>
                  </button>
                  {selectedDriver?.image ? (
                    <img alt={selectedName} src={selectedDriver.image} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white ${selectedDriver?.color ?? "bg-gradient-to-br from-purple-500 to-indigo-600"}`}>
                      {iniciales(selectedName)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-black">{selectedName}</p>
                    <p className="truncate text-[10px] font-semibold text-emerald-100/80">
                      {selectedDriver?.availability ?? "Conversación de Drivip"}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-white/50">verified</span>
                </div>

                <div
                  ref={listRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
                  style={{
                    backgroundColor: "#efeae2",
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(120,113,108,0.12) 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                >
                  {messagesLoading && (
                    <p className="py-8 text-center text-[12px] font-semibold text-slate-500">Cargando mensajes...</p>
                  )}
                  {!messagesLoading && mensajes.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                      <span className="material-symbols-outlined text-[42px] text-slate-400/70">chat_bubble</span>
                      <p className="mt-2 text-[12px] font-bold text-slate-600">Aún no hay mensajes</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Escribe el primero para coordinar con {selectedName}.
                      </p>
                    </div>
                  )}
                  {mensajes.map(renderBubble)}
                  {messagesError && (
                    <p className="mt-2 rounded-xl bg-red-50 p-2 text-center text-[11px] font-semibold text-red-600">
                      {messagesError}
                    </p>
                  )}
                </div>

                <form onSubmit={handleSend} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-[#f0f2f5] p-2">
                  <input
                    value={texto}
                    onChange={(event) => setTexto(event.target.value.slice(0, 1000))}
                    placeholder="Escribe un mensaje..."
                    autoComplete="off"
                    className="h-11 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-300"
                  />
                  <button
                    type="submit"
                    disabled={!texto.trim() || enviando}
                    aria-label="Enviar mensaje"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-md transition active:scale-95 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-[#f8fafc] px-10 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
                  <span className="material-symbols-outlined text-[42px] text-purple-400">forum</span>
                </div>
                <p className="mt-4 text-base font-black text-slate-800">Tu centro de mensajes</p>
                <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-slate-500">
                  Selecciona un conductor para ver el historial, los mensajes no leídos y escribirle.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
