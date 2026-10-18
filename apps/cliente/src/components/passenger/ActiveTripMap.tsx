import { useState, useEffect, useCallback } from "react";
import { useRealtimeUbicacionConductor } from "@drivip/supabase";
import { haversineKm } from "@drivip/maps";
import MapView from "./MapView";
import RatingModal from "./RatingModal";
import type { ActiveRide, RideStatus } from "../../types/passenger";

interface ActiveTripMapProps {
  ride: ActiveRide;
  onCallDriver: () => void;
  onCancelRide: () => void;
  onRateTrip: (rating: number, comment: string) => void;
  onComplete: () => void;
}

export default function ActiveTripMap({
  ride,
  onCallDriver,
  onCancelRide,
  onRateTrip,
  onComplete,
}: ActiveTripMapProps) {
  const [status, setStatus] = useState<RideStatus>(ride.status);
  const [conductorPos, setConductorPos] = useState<{ lat: number; lng: number; bearing: number } | null>(null);
  const [etaText, setEtaText] = useState("Calculando...");
  const [remainingKm, setRemainingKm] = useState(ride.distanceKm);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleUbicacion = useCallback((ubicacion: { lat: number; lng: number; direccion: number | null }) => {
    setConductorPos({
      lat: ubicacion.lat,
      lng: ubicacion.lng,
      bearing: ubicacion.direccion ?? 0,
    });
  }, []);

  useRealtimeUbicacionConductor(ride.tenantId, handleUbicacion);

  // Update ETA based on conductor position
  useEffect(() => {
    if (!conductorPos || !ride.originCoords) return;

    const dist = haversineKm(
      [conductorPos.lat, conductorPos.lng],
      ride.originCoords
    );

    setRemainingKm(dist);

    if (status === "arriving") {
      const etaMin = Math.max(1, Math.round(dist / 0.5)); // ~30km/h average
      setEtaText(`${etaMin} min`);
    } else if (status === "in_progress" && ride.destinationCoords) {
      const distToDest = haversineKm(
        [conductorPos.lat, conductorPos.lng],
        ride.destinationCoords
      );
      setRemainingKm(distToDest);
      const etaMin = Math.max(1, Math.round(distToDest / 0.5));
      setEtaText(`${etaMin} min`);
    }
  }, [conductorPos, ride.originCoords, ride.destinationCoords, status]);

  const statusConfig: Record<RideStatus, { label: string; color: string; icon: string }> = {
    idle: { label: "", color: "text-slate-500", icon: "" },
    requesting: { label: "Buscando conductor...", color: "text-amber-600", icon: "search" },
    waiting: { label: "Conductor confirmado", color: "text-blue-600", icon: "check_circle" },
    arriving: { label: "Conductor en camino", color: "text-emerald-600", icon: "directions_car" },
    in_progress: { label: "En ruta al destino", color: "text-purple-700", icon: "route" },
    completed: { label: "Viaje completado", color: "text-emerald-600", icon: "check_circle" },
    cancelled: { label: "Viaje cancelado", color: "text-red-500", icon: "cancel" },
  };

  const currentStatus = statusConfig[status];

  const handleCancel = () => {
    setStatus("cancelled");
    setShowCancelConfirm(false);
    onCancelRide();
  };

  useEffect(() => {
    if (status === "completed") {
      setTimeout(() => setRatingOpen(true), 600);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-100" data-purpose="active-trip-map">
      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          origin={ride.originCoords}
          destination={ride.destinationCoords}
          route={ride.route}
          conductorPosition={conductorPos}
        />

        {/* Status banner */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${status === "arriving" || status === "in_progress" ? "bg-emerald-500 animate-pulse" : status === "requesting" ? "bg-amber-500 animate-ping" : "bg-blue-500"}`}></span>
              <span className={`text-xs font-bold ${currentStatus.color}`}>{currentStatus.label}</span>
              {status !== "completed" && status !== "cancelled" && (
                <span className="ml-auto text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  ETA {etaText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={onComplete}
          className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 active:scale-90 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Bottom panel */}
      <div className="relative z-20 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-5 pt-5 pb-8 safe-area-bottom">
        {/* Conductor info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0">
            {ride.conductorImage ? (
              <img
                alt={`Conductor ${ride.conductorName}`}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                src={ride.conductorImage}
              />
            ) : (
              <div className={`w-14 h-14 rounded-2xl ${ride.conductorColor} flex items-center justify-center font-black text-lg shadow-md`}>
                {ride.conductorInitials}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-extrabold px-1 rounded-md flex items-center gap-0.5 shadow-sm">
              ★ {ride.conductorRating}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 truncate">{ride.conductorName}</h4>
            <p className="text-[11px] text-slate-500 font-medium">{ride.conductorVehicle} · <strong className="text-slate-700">{ride.conductorPlate}</strong></p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-emerald-600">{remainingKm.toFixed(1)} km</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-purple-700">${ride.priceUsd.toFixed(2)}</span>
            <p className="text-[10px] text-slate-400 font-medium">Bs. {ride.priceBs.toFixed(0)}</p>
          </div>
        </div>

        {/* Route summary */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex flex-col items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="w-0.5 h-4 bg-slate-200"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Origen</p>
              <p className="text-xs font-semibold text-slate-700 truncate">{ride.originAddress}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Destino</p>
              <p className="text-xs font-semibold text-slate-700 truncate">{ride.destinationAddress}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-slate-400">Distancia</p>
            <p className="text-xs font-bold text-slate-700">{ride.distanceKm.toFixed(1)} km</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Duración</p>
            <p className="text-xs font-bold text-slate-700">{ride.durationMin} min</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <a
            className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition"
            href={`tel:${ride.conductorPhone}`}
          >
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Llamar
          </a>
          {status !== "completed" && status !== "cancelled" && (
            <button
              className="py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition"
              onClick={() => setShowCancelConfirm(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cancelar
            </button>
          )}
          {status === "completed" && (
            <button
              className="py-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition"
              onClick={() => setRatingOpen(true)}
            >
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Calificar
            </button>
          )}
          <div className="py-3 rounded-xl bg-slate-50 text-center text-xs font-bold text-slate-500 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-lg text-slate-400">payments</span>
            {ride.paymentMethod === "usd" ? "Efectivo $" : ride.paymentMethod === "bs" ? "Efectivo BS" : "Pago Móvil"}
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 mx-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">¿Cancelar viaje?</h3>
              <p className="text-sm text-slate-500 mt-1">El conductor ya fue notificado. ¿Estás seguro?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold active:scale-95 transition"
                onClick={() => setShowCancelConfirm(false)}
              >
                No, volver
              </button>
              <button
                className="py-3 rounded-xl bg-red-500 text-white text-sm font-bold active:scale-95 transition"
                onClick={handleCancel}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      <RatingModal
        isOpen={ratingOpen}
        driverName={ride.conductorName}
        onClose={() => { setRatingOpen(false); onComplete(); }}
        onSubmit={(rating, comment) => {
          onRateTrip(rating, comment);
          setRatingOpen(false);
          onComplete();
        }}
      />
    </div>
  );
}
