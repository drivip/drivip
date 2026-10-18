import { useState, useCallback, useEffect } from "react";
import type { Carrera } from "@drivip/types";
import StatusHeroCard from "./driver/StatusHeroCard";
import DriverMapView from "./driver/DriverMapView";
import IncomingOrderModal from "./driver/IncomingOrderModal";
import EndTripConfirmation from "./driver/EndTripConfirmation";
import { MOCK_DAILY_REPORT } from "../mockData/driverMockData";

interface Props {
  onNavigate: (module: string) => void;
  carreras: Carrera[];
  isOnline: boolean;
  onToggleOnline: () => void;
  onAcceptCarrera: (id: string) => void;
  onRejectCarrera: (id: string) => void;
  onCompleteCarrera: (id: string) => void;
  carreraActiva: string | null;
  domain: string;
  profileName: string;
  isPaused?: boolean;
}

type DriverStatus = "disponible" | "no_trabajo" | "disponible_15" | "disponible_30";
type RidePhase = "idle" | "going_to_pickup" | "at_pickup" | "in_trip" | "at_destination";

export default function ChoferDashboard({
  onNavigate,
  carreras,
  isOnline,
  onToggleOnline,
  onAcceptCarrera,
  onRejectCarrera,
  onCompleteCarrera,
  carreraActiva,
  domain,
  profileName,
  isPaused,
}: Props) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>("disponible");
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showEndTrip, setShowEndTrip] = useState(false);
  const [ridePhase, setRidePhase] = useState<RidePhase>("idle");
  const [showTopCard, setShowTopCard] = useState(true);

  const carrerasHoy = carreras.filter((c) => {
    const today = new Date().toDateString();
    return new Date(c.created_at).toDateString() === today;
  });

  const ingresosHoy = carrerasHoy
    .filter((c) => c.estado === "completada")
    .reduce((sum, c) => sum + (c.precio ?? 0), 0);

  const carrerasCompletadas = carrerasHoy.filter((c) => c.estado === "completada").length;
  const carreraPendiente = carreras.find((c) => c.estado === "pendiente" && c.id !== carreraActiva);
  const carreraEnCurso = carreraActiva ? carreras.find((c) => c.id === carreraActiva) : null;

  const pickupCoords: [number, number] | null = (() => {
    if (ridePhase === "going_to_pickup" && carreraEnCurso) {
      return [carreraEnCurso.origen_lat, carreraEnCurso.origen_lng];
    }
    if (ridePhase === "in_trip" && carreraEnCurso) {
      return [carreraEnCurso.origen_lat, carreraEnCurso.origen_lng];
    }
    return null;
  })();

  const destinationCoords: [number, number] | null = (() => {
    if (ridePhase === "in_trip" && carreraEnCurso && carreraEnCurso.destino_lat && carreraEnCurso.destino_lng) {
      return [carreraEnCurso.destino_lat, carreraEnCurso.destino_lng];
    }
    return null;
  })();

  const handleStatusChange = (status: DriverStatus) => {
    setDriverStatus(status);
    if (status === "no_trabajo") {
      onToggleOnline();
    } else if (!isOnline) {
      onToggleOnline();
    }
  };

  const handleAcceptTrip = useCallback(() => {
    if (carreraPendiente) {
      onAcceptCarrera(carreraPendiente.id);
      setRidePhase("going_to_pickup");
      setShowIncomingModal(false);
      setShowTopCard(false);
    }
  }, [carreraPendiente, onAcceptCarrera]);

  const handleRejectTrip = useCallback((_reason?: string) => {
    if (carreraPendiente) {
      onRejectCarrera(carreraPendiente.id);
    }
    setShowIncomingModal(false);
    setRidePhase("idle");
  }, [carreraPendiente, onRejectCarrera]);

  const handleArrivedAtPickup = useCallback(() => {
    setRidePhase("at_pickup");
  }, []);

  const handleArrivedAtDestination = useCallback(() => {
    setRidePhase("at_destination");
  }, []);

  const handlePickupConfirmed = () => {
    setRidePhase("in_trip");
  };

  const handleCompleteTrip = () => {
    setShowEndTrip(true);
  };

  const handleEndTripConfirm = (_method: string, _verified: boolean) => {
    if (carreraActiva) {
      onCompleteCarrera(carreraActiva);
    }
    setShowEndTrip(false);
    setRidePhase("idle");
    setShowTopCard(true);
  };

  useEffect(() => {
    if (!carreraActiva && ridePhase !== "idle") {
      setRidePhase("idle");
      setShowTopCard(true);
    }
  }, [carreraActiva]);

  const isNavigating = ridePhase === "going_to_pickup" || ridePhase === "in_trip";

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-slate-100">
      {isPaused && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-amber-500 text-white text-[11px] font-bold text-center py-2 px-4 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px]">pause_circle</span>
          Tu cuenta esta pausada. No puedes recibir carreras nuevas.
        </div>
      )}
      <DriverMapView
        isOnline={isOnline}
        pickupCoords={pickupCoords}
        destinationCoords={destinationCoords}
        ridePhase={ridePhase}
        onArrivedAtPickup={handleArrivedAtPickup}
        onArrivedAtDestination={handleArrivedAtDestination}
      />

      {showTopCard && !isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-20 p-3">
          <StatusHeroCard
            currentStatus={driverStatus}
            onStatusChange={handleStatusChange}
            dailyEarnings={ingresosHoy}
            dailyRides={carrerasCompletadas}
            rating={MOCK_DAILY_REPORT.calificacionPromedio}
            onlineTime={MOCK_DAILY_REPORT.horasOnline}
          />
        </div>
      )}

      {!isNavigating && ridePhase === "idle" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="space-y-2 max-w-2xl mx-auto">
            {carreraPendiente && (
              <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-900">Nueva Solicitud</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                    Entrante
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center border-2 border-white shadow-md flex-shrink-0">
                      <span className="text-sm font-bold text-purple-700">
                        {carreraPendiente.cliente_id?.charAt(0)?.toUpperCase() ?? "C"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{carreraPendiente.origen_direccion ?? "Origen"}</p>
                      <p className="text-[10px] text-slate-500 truncate">→ {carreraPendiente.destino_direccion ?? "Destino"}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-base font-black text-slate-900">${(carreraPendiente.precio ?? 0).toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-purple-600">{carreraPendiente.distancia_km ?? 0} km</p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <button
                    onClick={() => setShowIncomingModal(true)}
                    className="col-span-2 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold active:scale-[0.98] transition flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    Detalle
                  </button>
                  <button
                    onClick={handleAcceptTrip}
                    className="col-span-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white text-xs font-black active:scale-[0.98] transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30"
                  >
                    <span className="material-symbols-outlined text-[16px] animate-bounce">check_circle</span>
                    Aceptar
                  </button>
                </div>
              </div>
            )}

            {!carreraPendiente && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] text-white">local_taxi</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Esperando carreras...</p>
                    <p className="text-[9px] text-slate-500">Te notificaremos cuando haya una solicitud</p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">local_taxi</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {ridePhase === "at_pickup" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900">Punto de Recogida</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                Recoger
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">{carreraEnCurso?.origen_direccion ?? "Destino del pasajero"}</p>
            <button
              onClick={handlePickupConfirmed}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white text-sm font-black active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Recogí al Pasajero
            </button>
          </div>
        </div>
      )}

      {ridePhase === "in_trip" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Viaje en Curso</h3>
                <p className="text-[10px] text-slate-500">→ {carreraEnCurso?.destino_direccion ?? "Destino"}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                En Curso
              </span>
            </div>
            <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Tarifa</span>
              <span className="text-base font-black text-slate-900">${(carreraEnCurso?.precio ?? 0).toFixed(2)}</span>
            </div>
            <button
              onClick={handleCompleteTrip}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Finalizar Viaje
            </button>
          </div>
        </div>
      )}

      {ridePhase === "at_destination" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[28px] text-emerald-600">celebration</span>
            </div>
            <p className="text-base font-black text-slate-900 mb-1">Viaje Completado</p>
            <p className="text-xs text-slate-500 mb-4">Cobra ${((carreraEnCurso?.precio ?? 0)).toFixed(2)} al pasajero</p>
            <button
              onClick={handleCompleteTrip}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Confirmar Cobro
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => onNavigate("menu")}
        className="absolute bottom-4 right-4 z-30 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200 flex items-center justify-center active:scale-90 transition lg:hidden"
      >
        <span className="material-symbols-outlined text-[20px] text-slate-700">grid_view</span>
      </button>

      {carreraPendiente && (
        <IncomingOrderModal
          isOpen={showIncomingModal}
          onAccept={handleAcceptTrip}
          onReject={handleRejectTrip}
          carrera={carreraPendiente}
        />
      )}

      <EndTripConfirmation
        isOpen={showEndTrip}
        onClose={() => setShowEndTrip(false)}
        onConfirm={handleEndTripConfirm}
        rideDetails={{
          cliente: carreraEnCurso?.cliente_id ?? "Pasajero",
          origen: carreraEnCurso?.origen_direccion ?? "Origen",
          destino: carreraEnCurso?.destino_direccion ?? "Destino",
          precioUsd: carreraEnCurso?.precio ?? 0,
          precioBs: (carreraEnCurso?.precio ?? 0) * 58,
        }}
      />
    </div>
  );
}
