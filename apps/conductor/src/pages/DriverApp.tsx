import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@drivip/ui";
import { useAuthContext, useCarreras, useRealtimeCarreras, useUbicaciones, useTenant, APP_URLS } from "@drivip/supabase";
import DriverHeader from "../components/driver/DriverHeader";
import DriverFullGridMenu from "../components/driver/DriverFullGridMenu";
import ChoferDashboard from "../components/ChoferDashboard";
import Carreras from "../components/Carreras";
import Historial from "../components/Historial";
import MiPerfil from "../components/MiPerfil";
import MisPrecios from "../components/MisPrecios";
import MiPlan from "../components/MiPlan";
import MisAliados from "../components/MisAliados";
import MisClientes from "../components/MisClientes";
import MisPagos from "../components/MisPagos";
import Referidos from "../components/Referidos";
import Configuracion from "../components/Configuracion";
import QRSection from "../components/QRSection";
import { MOCK_DRIVER_PROFILE } from "../mockData/driverMockData";

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
  | "config"
  | "qr"
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
  const { user, signOut } = useAuthContext();
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [carreraActiva, setCarreraActiva] = useState<string | null>(null);

  const { tenant } = useTenant(user?.email?.split("@")[0] ?? null);
  const { carreras, updateCarreraEstado } = useCarreras(tenant?.id);
  const { reportarUbicacion } = useUbicaciones(tenant?.id ?? "");

  const effectiveCarreras = demo ? MOCK_CARRERAS_CONDUCTOR : carreras;
  const isPaused = !demo && !!tenant?.pausado;

  const onCarreraCallbackRef = useRef<(carrera: any) => void>(() => {});
  onCarreraCallbackRef.current = (carrera: any) => {
    if (carrera.estado === "pendiente" && !carreraActiva) {
      setCarreraActiva(carrera.id);
    }
  };

  useRealtimeCarreras(tenant?.id ?? "", useCallback((carrera: any) => {
    onCarreraCallbackRef.current(carrera);
  }, []));

  useEffect(() => {
    if (!isOnline || !tenant?.id) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        reportarUbicacion({
          conductor_id: tenant.id,
          tenant_id: tenant.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          velocidad: pos.coords.speed ?? undefined,
          direccion: pos.coords.heading ?? undefined,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, tenant?.id, reportarUbicacion]);

  const handleNavigate = (module: string) => {
    setActiveModule(module as Module);
  };

  const acceptCarrera = async (id: string) => {
    await updateCarreraEstado(id, "aceptada");
    setCarreraActiva(id);
  };

  const rejectCarrera = async (id: string) => {
    await updateCarreraEstado(id, "cancelada");
    setCarreraActiva(null);
  };

  const completeCarrera = async (id: string) => {
    await updateCarreraEstado(id, "completada");
    setCarreraActiva(null);
  };

  const profile = {
    name: demo ? MOCK_DRIVER_PROFILE.nombre : (tenant?.nombre ?? user?.email ?? "Conductor"),
    slug: demo ? MOCK_DRIVER_PROFILE.slug : (tenant?.slug ?? "conductor"),
    initial: demo ? MOCK_DRIVER_PROFILE.nombre.charAt(0) : (tenant?.nombre?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? "C"),
  };

  const domain = APP_URLS.conductor;

  const isDashboard = activeModule === "dashboard";

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#f4f6f8]">
      {isPaused && !isDashboard && (
        <div className="bg-amber-500 text-white text-[11px] font-bold text-center py-2 px-4 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px]">pause_circle</span>
          Tu cuenta esta pausada por el administrador. Algunas funciones estan deshabilitadas.
        </div>
      )}
      {isDashboard ? (
        <ChoferDashboard
          onNavigate={handleNavigate}
          carreras={effectiveCarreras}
          isOnline={isOnline && !isPaused}
          onToggleOnline={() => !isPaused && setIsOnline(!isOnline)}
          onAcceptCarrera={acceptCarrera}
          onRejectCarrera={rejectCarrera}
          onCompleteCarrera={completeCarrera}
          carreraActiva={carreraActiva}
          domain={domain}
          profileName={profile.name}
          isPaused={isPaused}
        />
      ) : (
        <>
          <div className="lg:hidden">
            <DriverHeader
              domain={domain}
              isOnline={isOnline && !isPaused}
              profileInitial={profile.initial}
              onMenuClick={() => setMenuOpen(true)}
              onProfileClick={() => handleNavigate("perfil")}
            />
          </div>

          <main className="pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] h-[100dvh] overflow-y-auto lg:pt-0 lg:pb-0">
            {activeModule === "clientes" && <MisClientes />}
            {activeModule === "aliados" && <MisAliados />}
            {activeModule === "precios" && <MisPrecios />}
            {activeModule === "pagos" && <MisPagos />}
            {activeModule === "carreras" && (
              <Carreras
                carreras={effectiveCarreras}
                onAccept={acceptCarrera}
                onReject={rejectCarrera}
                onComplete={completeCarrera}
              />
            )}
            {activeModule === "historial" && <Historial />}
            {activeModule === "perfil" && <MiPerfil tenant={demo ? null : tenant} />}
            {activeModule === "plan" && <MiPlan tenant={demo ? null : tenant} />}
            {activeModule === "referidos" && <Referidos />}
            {activeModule === "config" && <Configuracion isPaused={isPaused} />}
            {activeModule === "qr" && (
              <QRSection profileSlug={profile.slug} profileName={profile.name} isOnline={isOnline && !isPaused} />
            )}
            {activeModule === "reportes" && <Historial />}
            {activeModule === "rutas" && <MisPrecios />}
            {activeModule === "tarifas" && <MisPrecios />}
          </main>

          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 lg:hidden">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              {bottomNavItems.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all active:scale-95",
                      isActive ? "text-purple-700" : "text-slate-500"
                    )}
                  >
                    <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {item.icon}
                    </span>
                    <span className={cn("text-[10px] font-semibold", isActive && "font-bold")}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      <DriverFullGridMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        driverName={profile.name}
        driverInitial={profile.initial}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
