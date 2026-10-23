import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { AdminConversacion } from "@drivip/types";
import { cn } from "@drivip/ui";
import { useAdminMensajes } from "@drivip/supabase";

interface AdminSoporteCenterProps {
  conversaciones: AdminConversacion[];
  loading: boolean;
  error: string | null;
  available: boolean;
  totalNoLeidos: number;
  initialTenantId?: string | null;
  onRefetch: () => void;
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

function iniciales(nombre: string): string {
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

export default function AdminSoporteCenter({
  conversaciones,
  loading,
  error,
  available,
  totalNoLeidos,
  initialTenantId = null,
  onRefetch,
}: AdminSoporteCenterProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(initialTenantId);
  const [busqueda, setBusqueda] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const seleccionada =
    conversaciones.find((item) => item.tenant_id === selectedTenantId) ?? null;

  const {
    mensajes,
    loading: mensajesLoading,
    error: mensajesError,
    available: mensajesAvailable,
    userId,
    enviar,
    marcarLeidos,
  } = useAdminMensajes(selectedTenantId, { generarAvisos: false, notificarPush: true });

  useEffect(() => {
    if (initialTenantId) setSelectedTenantId(initialTenantId);
  }, [initialTenantId]);

  useEffect(() => {
    if (!selectedTenantId) return;
    void marcarLeidos();
  }, [selectedTenantId, marcarLeidos]);

  useEffect(() => {
    if (!selectedTenantId || mensajes.length === 0) return;
    const timer = setTimeout(() => {
      void marcarLeidos();
      onRefetch();
    }, 350);
    return () => clearTimeout(timer);
  }, [mensajes.length, marcarLeidos, onRefetch, selectedTenantId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes.length, selectedTenantId]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return conversaciones;
    return conversaciones.filter((item) =>
      `${item.tenant_nombre} ${item.tenant_slug} ${item.tenant_email ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [busqueda, conversaciones]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!texto.trim() || enviando || !mensajesAvailable) return;
    setEnviando(true);
    const ok = await enviar(texto);
    if (ok) {
      setTexto("");
      onRefetch();
    }
    setEnviando(false);
  };

  return (
    <div className="px-4 py-4 pb-24 lg:px-8 lg:py-6 lg:pb-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-slate-900 lg:text-lg">
            <span className="material-symbols-outlined text-[22px] text-red-600">support_agent</span>
            Centro de Soporte
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500 lg:text-[12px]">
            Comunicación directa con los conductores: soporte, preguntas y avisos de suscripción.
          </p>
        </div>
        {totalNoLeidos > 0 && (
          <span className="rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-black text-rose-700">
            {totalNoLeidos} mensaje{totalNoLeidos === 1 ? "" : "s"} sin leer
          </span>
        )}
      </div>

      {!available && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-[12px] font-bold text-amber-800">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            Centro de comunicación pendiente de activación
          </p>
          <p className="mt-1 text-[11px] text-amber-700">
            Aplica la migración <code className="font-mono">2026-11-12_centro_comunicacion_admin.sql</code>{" "}
            para habilitar el canal en producción.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid h-[calc(100dvh-13rem)] min-h-[28rem] grid-cols-1 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-[320px_1fr]">
        <div
          className={cn(
            "flex min-h-0 flex-col border-slate-100 lg:border-r",
            selectedTenantId ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                search
              </span>
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar conductor..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] font-medium text-slate-900 outline-none focus:border-red-300"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading && (
              <p className="py-8 text-center text-[11px] font-semibold text-slate-400">
                Cargando conversaciones...
              </p>
            )}
            {!loading && filtradas.length === 0 && (
              <div className="px-4 py-10 text-center">
                <span className="material-symbols-outlined text-[38px] text-slate-300">forum</span>
                <p className="mt-2 text-[12px] font-bold text-slate-500">Sin conductores</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Los conductores aparecerán aquí para iniciar una conversación.
                </p>
              </div>
            )}

            {filtradas.map((item) => {
              const activa = item.tenant_id === selectedTenantId;
              return (
                <button
                  key={item.tenant_id}
                  type="button"
                  onClick={() => setSelectedTenantId(item.tenant_id)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                    activa
                      ? "border-red-200 bg-red-50"
                      : "border-transparent hover:bg-slate-50"
                  )}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-black text-white">
                    {iniciales(item.tenant_nombre)}
                    {item.no_leidos > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white">
                        {item.no_leidos > 9 ? "9+" : item.no_leidos}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-black text-slate-900">
                        {item.tenant_nombre}
                      </p>
                      <span className="shrink-0 text-[9px] font-semibold text-slate-400">
                        {hora(item.ultimo_mensaje_at)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[10px]",
                        item.no_leidos > 0 ? "font-bold text-slate-800" : "text-slate-500"
                      )}
                    >
                      {item.ultimo_mensaje ?? "Sin mensajes aún"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn("flex min-h-0 flex-col", selectedTenantId ? "flex" : "hidden lg:flex")}>
          {!selectedTenantId || !seleccionada ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <span className="material-symbols-outlined text-[32px]">mark_chat_unread</span>
              </div>
              <p className="mt-3 text-sm font-black text-slate-700">Selecciona un conductor</p>
              <p className="mt-1 max-w-xs text-[11px] leading-snug text-slate-400">
                Abre una conversación para responder preguntas, enviar avisos o dar soporte.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedTenantId(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95 lg:hidden"
                  aria-label="Volver a conversaciones"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-black text-white">
                  {iniciales(seleccionada.tenant_nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-black text-slate-900">
                    {seleccionada.tenant_nombre}
                  </h3>
                  <p className="truncate text-[10px] font-semibold text-slate-500">
                    {seleccionada.tenant_slug}
                    {seleccionada.tenant_email ? ` · ${seleccionada.tenant_email}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                  Conductor
                </span>
              </div>

              <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-3">
                {mensajesLoading && mensajes.length === 0 && (
                  <p className="py-8 text-center text-[11px] font-semibold text-slate-400">
                    Cargando mensajes...
                  </p>
                )}

                {!mensajesAvailable && (
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                    <span className="material-symbols-outlined text-[26px] text-amber-500">
                      warning
                    </span>
                    <p className="mt-1 text-[12px] font-bold text-amber-800">
                      Canal aún no disponible
                    </p>
                    <p className="mt-1 text-[10px] text-amber-700">
                      Aplica la migración del centro de comunicación para enviar mensajes.
                    </p>
                  </div>
                )}

                {mensajesAvailable && !mensajesLoading && mensajes.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-[38px] text-slate-300">
                      chat_bubble
                    </span>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">
                      Escribe el primer mensaje a {seleccionada.tenant_nombre}.
                    </p>
                  </div>
                )}

                {mensajes.map((mensaje) => {
                  if (mensaje.emisor_rol === "sistema") {
                    return (
                      <div key={mensaje.id} className="flex justify-center py-1">
                        <div className="max-w-[88%] rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-blue-600">
                              campaign
                            </span>
                            <p className="text-[10px] font-black text-blue-800">
                              {mensaje.titulo ?? "Aviso automático"}
                            </p>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-blue-700">
                            {mensaje.contenido}
                          </p>
                          <p className="mt-1 text-[9px] font-semibold text-blue-400">
                            {hora(mensaje.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  const esMio =
                    mensaje.emisor_rol === "superadmin" || mensaje.emisor_id === userId;

                  return (
                    <div
                      key={mensaje.id}
                      className={cn("flex", esMio ? "justify-end" : "justify-start")}
                    >
                      <div className="max-w-[80%]">
                        {!esMio && (
                          <p className="mb-0.5 ml-1 text-[9px] font-black uppercase tracking-wide text-slate-400">
                            {seleccionada.tenant_nombre}
                          </p>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2 text-[12px] leading-snug shadow-sm",
                            esMio
                              ? "rounded-br-md bg-slate-900 text-white"
                              : "rounded-bl-md bg-white text-slate-800"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                          <p
                            className={cn(
                              "mt-1 text-[9px] font-medium",
                              esMio ? "text-slate-300" : "text-slate-400"
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
                className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
              >
                <input
                  value={texto}
                  onChange={(event) => setTexto(event.target.value.slice(0, 2000))}
                  placeholder={
                    mensajesAvailable
                      ? `Escribe a ${seleccionada.tenant_nombre}...`
                      : "Canal no disponible"
                  }
                  disabled={!mensajesAvailable}
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-red-300 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!texto.trim() || enviando || !mensajesAvailable}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white active:scale-95 disabled:opacity-40"
                  aria-label="Enviar mensaje al conductor"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
              {mensajesError && (
                <p className="px-4 pb-2 text-[10px] font-semibold text-rose-600">{mensajesError}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
