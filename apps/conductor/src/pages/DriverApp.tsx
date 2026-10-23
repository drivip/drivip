import { useCallback, useEffect, useRef, useState } from "react";
import type { DisponibilidadConductor } from "@drivip/types";
import { cn, FloatingMessageBadge, PwaInstallPrompt } from "@drivip/ui";
import { haversineKm } from "@drivip/maps";
import {
  actualizarDisponibilidadConductor,
  APP_URLS,
  enviarPushCarrera,
  useAuthContext,
  useCarreras,
  useConversacionesConductor,
  useAdminMensajes,
  useMiTenant,
  leerDisponibilidadLocal,
  limpiarDisponibilidadLocal,
  useMensajeEntrante,
  useReportarUbicacion,
  PwaPermissionsPrompt,
} from "@drivip/supabase";
import DriverHeader from "../components/driver/DriverHeader";
import DriverFullGridMenu from "../components/driver/DriverFullGridMenu";
import DriverProfileModal from "../components/driver/DriverProfileModal";
import DriverReviewsModal from "../components/driver/DriverReviewsModal";
import ChoferDashboard from "../components/ChoferDashboard";
import Carreras from "../components/Carreras";
import Historial from "../components/Historial";
import MiPerfil from "../components/MiPerfil";
import MisPrecios from "../components/MisPrecios";
import Reservas from "../components/Reservas";
import MiPlan from "../components/MiPlan";
import MisAliados from "../components/MisAliados";
import MisClientes from "../components/MisClientes";
import MisPagos from "../components/MisPagos";
import Referidos from "../components/Referidos";
import Configuracion from "../components/Configuracion";
import CouponsManager from "../components/CouponsManager";
import QRSection from "../components/QRSection";
import {
  MOCK_CLIENTES_TENANT,
  MOCK_DRIVER_PROFILE,
} from "../mockData/driverMockData";

type Module =
  | "dashboard"
  | "clientes"
  | "aliados"
  | "precios"
  | "pagos"
  | "carreras"
  | "historial"
  | "perfil"
  | "plan"
  | "referidos"
  | "cupones"
  | "config"
  | "qr"
  | "reservas"
  | "reportes"
  | "rutas"
  | "tarifas";

const bottomNavItems = [
  { id: "dashboard", icon: "two_wheeler", label: "En Vivo" },
  { id: "carreras", icon: "local_taxi", label: "Carreras" },
  { id: "pagos", icon: "account_balance_wallet", label: "Billetera" },
  { id: "qr", icon: "qr_code_2", label: "QR / PWA" },
  { id: "config", icon: "tune", label: "Ajustes" },
];

const MOCK_CARRERAS_CONDUCTOR = [
  { id: "cc1", tenant_id: "tc1", conductor_id: "tc1", cliente_id: "u1", estado: "completada" as const, origen_lat: 10.4806, origen_lng: -66.9036, origen_direccion: "Av. Libertador, Caracas", destino_lat: 10.4920, destino_lng: -66.8850, destino_direccion: "Centro Comercial Tolon", distancia_km: 3.2, duracion_min: 12, precio: 5.50, metodo_pago: "efectivo" as const, comprobante_url: null, calificacion: 5, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
  { id: "cc2", tenant_id: "tc1", conductor_id: "tc1", cliente_id: "u2", estado: "completada" as const, origen_lat: 10.4850, origen_lng: -66.8950, origen_direccion: "Plaza Venezuela", destino_lat: 10.4980, destino_lng: -66.8800, destino_direccion: "Altamira", distancia_km: 4.1, duracion_min: 18, precio: 7.25, metodo_pago: "pago_movil" as const, comprobante_url: null, calificacion: 4, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
  { id: "cc3", tenant_id: "tc1", conductor_id: "tc1", cliente_id: "u3", estado: "pendiente" as const, origen_lat: 10.4750, origen_lng: -66.9100, origen_direccion: "Los Palos Grandes", destino_lat: 10.4900, destino_lng: -66.8700, destino_direccion: "Las Mercedes", distancia_km: 5.0, duracion_min: 20, precio: 8.50, metodo_pago: "efectivo" as const, comprobante_url: null, calificacion: null, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
];


export default function DriverApp({ demo }: { demo?: boolean }) {
  const { user } = useAuthContext();
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<"perfil" | "mensajes" | "soporte">("perfil");
  const [profileConversationId, setProfileConversationId] = useState<string | null>(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [carreraActiva, setCarreraActiva] = useState<string | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadConductor>("disponible");
  const [disponibilidadNota, setDisponibilidadNota] = useState<string | null>(null);
  const [disponibilidadHasta, setDisponibilidadHasta] = useState<string | null>(null);
  const [disponibilidadError, setDisponibilidadError] = useState<string | null>(null);
  const [guardandoDisponibilidad, setGuardandoDisponibilidad] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const arrivedNotifiedRef = useRef<Set<string>>(new Set());
  const terminalPendingRef = useRef<Set<string>>(new Set());
  const lastReportAtRef = useRef(0);
  const lastReportPosRef = useRef<[number, number] | null>(null);
  const restoredCarreraRef = useRef(false);

  const { tenant, refetch: refetchTenant } = useMiTenant(demo ? null : user?.id);
  const { carreras, updateCarreraEstado, marcarLlegadaCarrera, quoteCarrera } = useCarreras(tenant?.id);
  const { reportarUbicacion } = useReportarUbicacion();
  const {
    conversaciones,
    userId,
    loading: conversacionesLoading,
    totalNoLeidos,
    marcarLeida,
    refetch: refetchConversaciones,
  } = useConversacionesConductor(tenant?.id);
  const { mensaje: mensajeEntrante, ocultar: ocultarMensajeEntrante } =
    useMensajeEntrante(conversaciones, userId, conversacionesLoading);
  const {
    mensajes: soporteMensajes,
    userId: soporteUserId,
    loading: soporteLoading,
    error: soporteError,
    available: soporteAvailable,
    unread: soporteUnread,
    mensajeEntrante: mensajeSoporteEntrante,
    ocultarMensajeEntrante: ocultarMensajeSoporteEntrante,
    enviar: enviarSoporte,
    marcarLeidos: marcarSoporteLeidos,
  } = useAdminMensajes(demo ? null : (tenant?.id ?? null));

  const effectiveCarreras = demo ? MOCK_CARRERAS_CONDUCTOR : carreras;
  const isPaused = !demo && !!tenant?.pausado;

  useEffect(() => {
    if (!tenant) return;

    const local = leerDisponibilidadLocal(tenant.id);
    if (local && tenant.disponibilidad === undefined) {
      setDisponibilidad(local.estado);
      setDisponibilidadNota(local.nota);
      setDisponibilidadHasta(local.hasta);
      setIsOnline(local.estado === "disponible" && !tenant.pausado);
      return;
    }
    if (tenant.disponibilidad !== undefined) {
      limpiarDisponibilidadLocal(tenant.id);
    }

    const estado = tenant.disponibilidad ?? "disponible";
    setDisponibilidad(estado);
    setDisponibilidadNota(tenant.disponibilidad_nota ?? null);
    setDisponibilidadHasta(tenant.disponibilidad_hasta ?? null);
    setIsOnline(estado === "disponible" && !tenant.pausado);
  }, [
    tenant?.id,
    tenant?.disponibilidad,
    tenant?.disponibilidad_nota,
    tenant?.disponibilidad_hasta,
    tenant?.pausado,
  ]);

  const cambiarDisponibilidad = useCallback(
    async (estado: DisponibilidadConductor, nota?: string | null) => {
      const notaFinal =
        estado === "personalizado"
          ? nota?.trim() || "No disponible"
          : estado === "pausa_30"
            ? nota?.trim() || "Se desocupa en 30 min"
            : null;
      const hasta = estado === "pausa_30" ? new Date(Date.now() + 30 * 60000).toISOString() : null;

      setDisponibilidad(estado);
      setDisponibilidadNota(notaFinal);
      setDisponibilidadHasta(hasta);
      setIsOnline(estado === "disponible" && !isPaused);
      setDisponibilidadError(null);

      if (demo) return;

      setGuardandoDisponibilidad(true);

      const resultado = await actualizarDisponibilidadConductor(
        estado,
        nota,
        tenant?.id
      );
      setGuardandoDisponibilidad(false);

      if (!resultado.ok) {
        // Mantenemos el estado elegido en pantalla para que los botones
        // respondan aunque la migración SQL aún no esté aplicada.
        setDisponibilidadError(
          "El estado se guardó en este dispositivo, pero no se pudo sincronizar con el servidor."
        );
      }
    },
    [demo, isPaused, tenant?.id]
  );

  useEffect(() => {
    if (demo || restoredCarreraRef.current || carreras.length === 0) return;
    restoredCarreraRef.current = true;
    const activa = carreras.find(
      (c) => c.estado === "aceptada" || c.estado === "en_curso"
    );
    if (activa) {
      setCarreraActiva(activa.id);
      if (disponibilidad === "disponible") {
        void cambiarDisponibilidad("ocupado", "En servicio");
      }
    }
  }, [carreras, demo, disponibilidad, cambiarDisponibilidad]);

  useEffect(() => {
    if (disponibilidad !== "pausa_30" || !disponibilidadHasta) return;
    const restante = new Date(disponibilidadHasta).getTime() - Date.now();
    if (restante <= 0) {
      void cambiarDisponibilidad("disponible");
      return;
    }
    const timer = setTimeout(() => { void cambiarDisponibilidad("disponible"); }, restante);
    return () => clearTimeout(timer);
  }, [disponibilidad, disponibilidadHasta, cambiarDisponibilidad]);

  useEffect(() => {
    if (!carreraActiva) return;
    const activa = effectiveCarreras.find((c) => c.id === carreraActiva);
    if (
      activa &&
      (activa.estado === "completada" || activa.estado === "cancelada") &&
      !terminalPendingRef.current.has(activa.id)
    ) {
      setCarreraActiva(null);
      if (disponibilidad === "ocupado" || disponibilidad === "personalizado") {
        void cambiarDisponibilidad("disponible");
      }
    }
  }, [carreraActiva, effectiveCarreras, disponibilidad, cambiarDisponibilidad]);

  useEffect(() => {
    if ((!isOnline && !carreraActiva) || !tenant?.id) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const now = Date.now();
        const lastPos = lastReportPosRef.current;
        const movedKm = lastPos ? haversineKm(lastPos, coords) : Infinity;

        // Evita saturar la red: maximo un reporte cada 5 s o 30 m.
        if (now - lastReportAtRef.current < 5000 && movedKm < 0.03) return;

        lastReportAtRef.current = now;
        lastReportPosRef.current = coords;
        void reportarUbicacion({
          lat: coords[0],
          lng: coords[1],
          velocidad: pos.coords.speed ?? null,
          direccion: pos.coords.heading ?? null,
          carrera_id: carreraActiva,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, carreraActiva, tenant?.id, reportarUbicacion]);

  const openProfile = (
    tab: "perfil" | "mensajes" | "soporte" = "perfil",
    conversationId: string | null = null
  ) => {
    setProfileTab(tab);
    setProfileConversationId(conversationId);
    setProfileOpen(true);
    if (tab === "mensajes") ocultarMensajeEntrante();
    if (tab === "soporte") ocultarMensajeSoporteEntrante();
  };

  const openMensajeEntrante = () => {
    if (!mensajeEntrante) return;
    openProfile("mensajes", mensajeEntrante.conversacion.conversacion_id);
    ocultarMensajeEntrante();
  };

  const openSoporteEntrante = () => {
    openProfile("soporte");
    ocultarMensajeSoporteEntrante();
  };

  const handleNavigate = (module: string) => {
    if (module === "mensajes") {
      openProfile("mensajes");
      return;
    }
    if (module === "soporte") {
      openProfile("soporte");
      return;
    }
    if (module === "perfil") {
      openProfile("perfil");
      return;
    }
    if (module === "resenas") {
      setReviewsOpen(true);
      return;
    }
    setActiveModule(module as Module);
  };

  const acceptCarrera = async (id: string) => {
    const ok = await updateCarreraEstado(id, "aceptada");
    if (ok) {
      setCarreraActiva(id);
      void cambiarDisponibilidad("ocupado", "En servicio");
      void enviarPushCarrera({
        carrera_id: id,
        title: "Solicitud aceptada",
        body: "Tu conductor aceptó el viaje y va en camino al punto de recogida.",
        tag: `carrera-${id}`,
        data: { carrera_id: id },
      });
    }
  };

  const sendQuote = async (id: string, precio: number) => {
    const ok = await quoteCarrera(id, precio);
    if (ok) {
      void enviarPushCarrera({
        carrera_id: id,
        title: "Precio de tu compra",
        body: `Tu conductor cotizó $${precio.toFixed(2)}. Revisa el precio en el seguimiento.`,
        tag: `carrera-${id}`,
        data: { carrera_id: id },
      });
    }
    return ok;
  };

  const rejectCarrera = async (id: string) => {
    const eraActiva = carreraActiva === id;
    terminalPendingRef.current.add(id);
    const ok = await updateCarreraEstado(id, "cancelada");
    terminalPendingRef.current.delete(id);
    if (!ok) return;
    void enviarPushCarrera({
      carrera_id: id,
      title: "Solicitud no aceptada",
      body: "El conductor no pudo tomar tu solicitud. Elige otro conductor de tu red.",
      tag: `carrera-${id}`,
      data: { carrera_id: id },
    });
    setCarreraActiva(null);
    if (eraActiva && (disponibilidad === "ocupado" || disponibilidad === "personalizado")) {
      void cambiarDisponibilidad("disponible");
    }
  };

  const startCarrera = async (id: string) => {
    const ok = await updateCarreraEstado(id, "en_curso");
    if (ok) {
      void enviarPushCarrera({
        carrera_id: id,
        title: "Viaje iniciado",
        body: "El conductor marcó el inicio del viaje. Buen camino.",
        tag: `carrera-${id}`,
        data: { carrera_id: id },
      });
    }
  };

  const notifyArrivedAtPickup = async (id: string) => {
    if (arrivedNotifiedRef.current.has(id)) return;
    arrivedNotifiedRef.current.add(id);

    const ok = await marcarLlegadaCarrera(id);
    if (!ok) {
      arrivedNotifiedRef.current.delete(id);
      return;
    }

    void enviarPushCarrera({
      carrera_id: id,
      title: "Tu conductor llegó",
      body: "El conductor está en el punto de recogida.",
      tag: `carrera-${id}`,
      data: { carrera_id: id },
    });
  };

  const completeCarrera = async (id: string) => {
    terminalPendingRef.current.add(id);
    const ok = await updateCarreraEstado(id, "completada");
    terminalPendingRef.current.delete(id);
    if (!ok) return;
    void enviarPushCarrera({
      carrera_id: id,
      title: "Viaje completado",
      body: "Llegaste a tu destino. Califica tu viaje.",
      tag: `carrera-${id}`,
      data: { carrera_id: id },
    });
    setCarreraActiva(null);
    void cambiarDisponibilidad("disponible");
  };

  const profile = {
    name: demo ? MOCK_DRIVER_PROFILE.nombre : (tenant?.nombre ?? user?.email ?? "Conductor"),
    slug: demo ? MOCK_DRIVER_PROFILE.slug : (tenant?.slug ?? "conductor"),
    initial: demo
      ? MOCK_DRIVER_PROFILE.nombre.charAt(0)
      : (tenant?.nombre?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? "C"),
  };

  const domain = APP_URLS.conductor;

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#f1f4f8]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.16) 1px, transparent 0)",
        backgroundSize: "18px 18px",
      }}
    >
      {isPaused && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-[11px] font-bold text-white">
          <span className="material-symbols-outlined text-[16px]">pause_circle</span>
          Tu cuenta está pausada por el administrador. No puedes recibir carreras nuevas.
        </div>
      )}

      <DriverHeader
        domain={domain}
        isOnline={isOnline && !isPaused}
        profileInitial={profile.initial}
        onMenuClick={() => setMenuOpen(true)}
        onProfileClick={() => openProfile("perfil")}
      />

      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {activeModule === "dashboard" && !demo && (
          <div className="px-4 pt-3">
            <PwaInstallPrompt appName="Drivip Conductor" accent="purple" />
          </div>
        )}

        {activeModule === "dashboard" && (
          <ChoferDashboard
            onNavigate={handleNavigate}
            tenantId={tenant?.id}
            carreras={effectiveCarreras}
            disponibilidad={disponibilidad}
            disponibilidadNota={disponibilidadNota}
            disponibilidadHasta={disponibilidadHasta}
            guardandoDisponibilidad={guardandoDisponibilidad}
            disponibilidadError={disponibilidadError}
            onDisponibilidadChange={cambiarDisponibilidad}
            onAcceptCarrera={acceptCarrera}
            onRejectCarrera={rejectCarrera}
            onStartCarrera={startCarrera}
            onCompleteCarrera={completeCarrera}
            onArrivedAtPickup={notifyArrivedAtPickup}
            onQuoteCarrera={sendQuote}
            carreraActiva={carreraActiva}
            profileName={profile.name}
            isPaused={isPaused}
            totalNoLeidos={totalNoLeidos}
          />
        )}
        {activeModule === "clientes" && (
          <MisClientes
            tenantId={tenant?.id}
            carreras={effectiveCarreras}
            clientesMock={demo ? MOCK_CLIENTES_TENANT : undefined}
          />
        )}
        {activeModule === "aliados" && <MisAliados tenantId={tenant?.id} />}
        {activeModule === "precios" && <MisPrecios tenant={tenant} demo={demo} onSaved={refetchTenant} />}
        {activeModule === "pagos" && <MisPagos carreras={effectiveCarreras} tenant={tenant} tenantId={tenant?.id} />}
        {activeModule === "carreras" && (
          <Carreras
            carreras={effectiveCarreras}
            onAccept={acceptCarrera}
            onReject={rejectCarrera}
            onComplete={completeCarrera}
          />
        )}
        {activeModule === "historial" && <Historial carreras={effectiveCarreras} tenantId={tenant?.id} />}
        {activeModule === "perfil" && <MiPerfil tenant={tenant} demo={demo} onSaved={refetchTenant} />}
        {activeModule === "plan" && <MiPlan tenant={tenant} demo={demo} />}
        {activeModule === "referidos" && <Referidos tenant={tenant} />}
        {activeModule === "cupones" && (
          <CouponsManager
            tenantId={tenant?.id}
            demo={demo}
            conductorNombre={profile.name}
            onNavigateMessages={() => openProfile("mensajes")}
          />
        )}
        {activeModule === "config" && (
          <Configuracion
            isPaused={isPaused}
            tenantId={tenant?.id}
            tenant={tenant}
            demo={demo}
            onSaved={refetchTenant}
          />
        )}
        {activeModule === "qr" && (
          <QRSection profileSlug={profile.slug} profileName={profile.name} isOnline={isOnline && !isPaused} />
        )}
        {activeModule === "reservas" && <Reservas tenantId={tenant?.id} demo={demo} />}
        {activeModule === "reportes" && <Historial carreras={effectiveCarreras} tenantId={tenant?.id} />}
        {activeModule === "rutas" && <MisPrecios tenant={tenant} demo={demo} onSaved={refetchTenant} />}
        {activeModule === "tarifas" && <MisPrecios tenant={tenant} demo={demo} onSaved={refetchTenant} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-2 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {bottomNavItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-all active:scale-95",
                  isActive ? "text-purple-700" : "text-slate-500"
                )}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className={cn("text-[10px] font-semibold", isActive && "font-bold")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <DriverFullGridMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        driverName={profile.name}
        driverInitial={profile.initial}
        unreadMessages={totalNoLeidos}
        unreadSupport={soporteUnread}
        onNavigate={handleNavigate}
      />

      {mensajeEntrante && !mensajeSoporteEntrante && !(profileOpen && profileTab === "mensajes") && (
        <FloatingMessageBadge
          title={mensajeEntrante.conversacion.cliente_nombre}
          message={mensajeEntrante.conversacion.ultimo_mensaje ?? "Nuevo mensaje"}
          time={
            mensajeEntrante.conversacion.ultimo_mensaje_at
              ? new Date(
                  mensajeEntrante.conversacion.ultimo_mensaje_at
                ).toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined
          }
          count={mensajeEntrante.count}
          onOpen={openMensajeEntrante}
          onHide={ocultarMensajeEntrante}
          accent="emerald"
        />
      )}

      {mensajeSoporteEntrante && !(profileOpen && profileTab === "soporte") && (
        <FloatingMessageBadge
          title="Drivip Soporte"
          message={mensajeSoporteEntrante.contenido}
          time={new Date(mensajeSoporteEntrante.created_at).toLocaleTimeString("es-VE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          onOpen={openSoporteEntrante}
          onHide={ocultarMensajeSoporteEntrante}
          accent="purple"
        />
      )}

      <DriverProfileModal
        isOpen={profileOpen}
        initialTab={profileTab}
        initialConversationId={profileConversationId}
        onClose={() => setProfileOpen(false)}
        tenant={tenant}
        demo={demo}
        profileName={profile.name}
        profileSlug={profile.slug}
        profileInitial={profile.initial}
        conversaciones={conversaciones}
        loadingConversaciones={conversacionesLoading}
        userId={userId}
        onMarcarLeida={marcarLeida}
        onRefetchConversaciones={refetchConversaciones}
        onNavigate={handleNavigate}
        soporteMensajes={soporteMensajes}
        soporteLoading={soporteLoading}
        soporteError={soporteError}
        soporteAvailable={soporteAvailable}
        soporteUserId={soporteUserId}
        soporteUnread={soporteUnread}
        onEnviarSoporte={enviarSoporte}
        onMarcarSoporteLeido={marcarSoporteLeidos}
        onSaved={refetchTenant}
      />

      <DriverReviewsModal
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        tenantId={tenant?.id}
      />

      {!demo && (
        <PwaPermissionsPrompt
          appName="Drivip Conductor"
          tenantId={tenant?.id}
          role="conductor"
        />
      )}
    </div>
  );
}
