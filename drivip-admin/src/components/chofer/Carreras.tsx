"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { carrerasData, pendingRequests } from "@/mockData/carrerasData";
import Badge from "@/components/ui/Badge";
import dynamic from "next/dynamic";
import useGeolocation from "@/hooks/useGeolocation";
import {
  fetchRoute,
  haversineKm,
  calcBearing,
  getDistanceToRoute,
  findNearestStepIndex,
  getIconForManeuver,
  type NavRoute,
  type NavStep,
} from "@/lib/navigationService";

const MapLibreView = dynamic(() => import("@/components/map/MapLibreView"), { ssr: false });

const DEFAULT_COORDS: [number, number] = [10.4806, -66.9036];
const OFF_ROUTE_THRESHOLD = 50;
const ARRIVAL_THRESHOLD = 0.03;

type RidePhase = "disponible" | "solicitada" | "aceptada" | "en_curso" | "completada";

export default function Carreras() {
  const [rideState, setRideState] = useState<RidePhase>("disponible");
  const [selectedRequest, setSelectedRequest] = useState<(typeof pendingRequests)[number] | null>(null);
  const [fareAccumulated, setFareAccumulated] = useState(0);
  const [timerCountdown, setTimerCountdown] = useState(15);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [starRating, setStarRating] = useState(0);

  // Navigation state
  const [navRoute, setNavRoute] = useState<NavRoute | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingKm, setRemainingKm] = useState(0);
  const [remainingMin, setRemainingMin] = useState(0);
  const [arrived, setArrived] = useState(false);

  const { latitude, longitude, heading, isTracking } = useGeolocation();

  const prevPosRef = useRef<[number, number] | null>(null);
  const computedBearingRef = useRef(0);
  const lastRecalcRef = useRef(0);

  const todayRides = carrerasData.filter((c) => c.status === "COMPLETADA").length;
  const todayEarnings = carrerasData.filter((c) => c.status === "COMPLETADA").reduce((sum, c) => sum + c.total, 0);

  const driverCoords: [number, number] =
    isTracking && latitude && longitude ? [latitude, longitude] : DEFAULT_COORDS;

  useEffect(() => {
    if (!latitude || !longitude) return;
    const cur: [number, number] = [latitude, longitude];
    if (prevPosRef.current) {
      computedBearingRef.current = calcBearing(prevPosRef.current, cur);
    }
    prevPosRef.current = cur;
  }, [latitude, longitude]);

  const carBearing = heading && heading > 0 ? heading : computedBearingRef.current;

  const carPosition = isTracking && latitude && longitude
    ? { lat: driverCoords[0], lng: driverCoords[1], bearing: carBearing }
    : null;

  const currentStep: NavStep | null = navRoute && navRoute.steps[currentStepIdx] || null;

  // Recalculate route periodically
  useEffect(() => {
    if (!navRoute || !selectedRequest || (rideState !== "aceptada" && rideState !== "en_curso")) return;

    const target: [number, number] = rideState === "aceptada"
      ? [selectedRequest.originLat, selectedRequest.originLng]
      : [selectedRequest.destinationLat, selectedRequest.destinationLng];

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastRecalcRef.current < 5000) return;

      const distToDest = haversineKm(driverCoords, target);
      setRemainingKm(distToDest);
      setRemainingMin(Math.max(1, Math.round(distToDest * 3)));

      if (distToDest < ARRIVAL_THRESHOLD) {
        setArrived(true);
        return;
      }

      const distToRoute = getDistanceToRoute(driverCoords, navRoute.geometry);
      if (distToRoute > OFF_ROUTE_THRESHOLD) {
        lastRecalcRef.current = now;
        fetchRoute(driverCoords, target).then((newRoute) => {
          if (newRoute) { setNavRoute(newRoute); setCurrentStepIdx(0); }
        });
        return;
      }

      const nearestIdx = findNearestStepIndex(driverCoords, navRoute.steps);
      if (nearestIdx !== currentStepIdx) setCurrentStepIdx(nearestIdx);
    }, 2000);

    return () => clearInterval(interval);
  }, [navRoute, rideState, selectedRequest, driverCoords, currentStepIdx]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  useEffect(() => {
    if (rideState !== "solicitada" || !selectedRequest) return;
    setTimerCountdown(selectedRequest.timeLeft || 15);
    const interval = setInterval(() => {
      setTimerCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); handleRejectRequest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rideState, selectedRequest]);

  useEffect(() => {
    if (rideState !== "en_curso") return;
    setFareAccumulated(selectedRequest?.fare || 0);
    const interval = setInterval(() => { setFareAccumulated((prev) => prev + 2); }, 3000);
    return () => clearInterval(interval);
  }, [rideState, selectedRequest]);

  function simulateNewRequest() {
    if (pendingRequests.length === 0) return;
    setSelectedRequest(pendingRequests[0]);
    setRideState("solicitada");
    showToast("Nueva solicitud de carrera");
  }

  async function handleAcceptRequest() {
    if (!selectedRequest) return;
    setRideState("aceptada");
    setArrived(false);
    const route = await fetchRoute(driverCoords, [selectedRequest.originLat, selectedRequest.originLng]);
    if (route) { setNavRoute(route); setCurrentStepIdx(0); }
    showToast("Carrera aceptada — yendo al origen");
  }

  function handleRejectRequest() {
    setSelectedRequest(null);
    setRideState("disponible");
    setTimerCountdown(15);
    setNavRoute(null);
    setArrived(false);
    showToast("Solicitud rechazada");
  }

  async function handleArrived() {
    if (!selectedRequest) return;
    setRideState("en_curso");
    setArrived(false);
    const route = await fetchRoute(
      [selectedRequest.originLat, selectedRequest.originLng],
      [selectedRequest.destinationLat, selectedRequest.destinationLng]
    );
    if (route) { setNavRoute(route); setCurrentStepIdx(0); }
    showToast("Cliente recogido — en camino al destino");
  }

  function handleFinalizeRide() {
    setRideState("completada");
    setNavRoute(null);
    setArrived(false);
    showToast("Carrera completada");
  }

  function handleDone() {
    setRideState("disponible");
    setSelectedRequest(null);
    setFareAccumulated(0);
    setStarRating(0);
    setNavRoute(null);
    setArrived(false);
    showToast("Listo para nueva carrera");
  }

  const mapCenter = carPosition
    ? [carPosition.lat, carPosition.lng] as [number, number]
    : rideState === "solicitada" && selectedRequest
      ? [selectedRequest.originLat, selectedRequest.originLng] as [number, number]
      : driverCoords;

  const mapRoute = navRoute?.geometry || undefined;

  const mapOrigin = selectedRequest
    ? { lat: selectedRequest.originLat, lng: selectedRequest.originLng, label: "Origen" }
    : null;
  const mapDest = selectedRequest
    ? { lat: selectedRequest.destinationLat, lng: selectedRequest.destinationLng, label: "Destino" }
    : null;

  const isNavigating = navRoute !== null && (rideState === "aceptada" || rideState === "en_curso") && !arrived;

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      {toastVisible && (
        <div className="fixed top-4 left-4 right-4 z-[2000] rounded-xl bg-secondary px-4 py-3 text-center font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-black shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Full-screen map */}
      <div className="relative flex-1 min-h-[40vh]">
        <MapLibreView
          center={mapCenter}
          zoom={17}
          carPosition={carPosition}
          route={mapRoute}
          origin={mapOrigin}
          destination={mapDest}
          className="!rounded-none"
        />

        {/* Turn-by-turn navigation bar */}
        {isNavigating && currentStep && (
          <div className="absolute top-0 left-0 right-0 z-[1000]">
            <div className="bg-gradient-to-b from-surface/98 to-surface/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px] text-white">
                    {getIconForManeuver(currentStep.type, currentStep.modifier)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white truncate">
                    {currentStep.instruction}
                  </p>
                  {currentStep.streetName && (
                    <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-neutral-300 truncate">
                      en {currentStep.streetName}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-secondary">
                    {currentStep.distance < 1000
                      ? `${Math.round(currentStep.distance)}m`
                      : `${(currentStep.distance / 1000).toFixed(1)}km`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-neutral-500">route</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">
                      {remainingKm < 1 ? `${Math.round(remainingKm * 1000)}m` : `${remainingKm.toFixed(1)}km`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-neutral-500">schedule</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">~{remainingMin} min</span>
                  </div>
                </div>
                <button
                  onClick={rideState === "aceptada" ? handleArrived : handleFinalizeRide}
                  className="rounded-xl bg-primary px-4 py-2 font-[family-name:var(--font-space-grotesk)] text-[12px] font-bold text-white transition-all active:scale-95"
                >
                  {rideState === "aceptada" ? "Llegué" : "Finalizar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Arrived overlay */}
        {arrived && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-black/40">
            <div className="rounded-2xl bg-surface p-6 shadow-2xl text-center mx-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 mb-3">
                <span className="material-symbols-outlined text-[32px] text-secondary">check_circle</span>
              </div>
              <p className="font-[family-name:var(--font-space-grotesk)] text-[18px] font-bold text-white mb-1">
                {rideState === "aceptada" ? "Llegaste al origen" : "Llegaste al destino"}
              </p>
              <p className="font-[family-name:var(--font-geist-sans)] text-[13px] text-neutral-400 mb-4">
                {rideState === "aceptada" ? "Recoge al cliente" : "Carrera completada"}
              </p>
              <button
                onClick={rideState === "aceptada" ? handleArrived : handleFinalizeRide}
                className="w-full rounded-xl bg-primary py-3 font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-white transition-all active:scale-95"
              >
                {rideState === "aceptada" ? "Recogí al cliente" : "Finalizar carrera"}
              </button>
            </div>
          </div>
        )}

        {/* Floating stats */}
        {!isNavigating && !arrived && (
          <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between">
            <div className="rounded-xl bg-surface/90 backdrop-blur-md px-3 py-2 shadow-lg border border-white/5">
              <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Hoy</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-secondary">{formatCurrency(todayEarnings)}</p>
            </div>
            <div className="rounded-xl bg-surface/90 backdrop-blur-md px-3 py-2 shadow-lg border border-white/5">
              <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Carreras</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-white">{todayRides}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="relative z-[1000] bg-surface rounded-t-3xl border-t border-white/5 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="p-4 pb-24">

          {rideState === "disponible" && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
                  <span className="material-symbols-outlined text-[28px] text-primary animate-pulse">local_taxi</span>
                </div>
                <p className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-white">Esperando carreras</p>
                <p className="mt-1 font-[family-name:var(--font-geist-sans)] text-[12px] text-neutral-400">Tu posición GPS se muestra en el mapa</p>
              </div>

              {pendingRequests.length > 0 && pendingRequests.map((req) => (
                <div key={req.id} className="rounded-xl bg-surface-container p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white">{req.clientName}</p>
                      <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">★ {req.rating.toFixed(1)}</p>
                    </div>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-secondary">{formatCurrency(req.fare)}</p>
                  </div>
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-secondary" /><span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-white">{req.origin}</span></div>
                    <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-error" /><span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-white">{req.destination}</span></div>
                  </div>
                  <div className="mb-3 flex gap-4">
                    <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-300">{req.distance} km</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-secondary font-bold">{formatCurrency(req.fare)}</span>
                  </div>
                  <button onClick={simulateNewRequest} className="w-full rounded-xl bg-secondary py-3.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-black transition-all active:scale-95 shadow-[0_0_20px_rgba(78,222,163,0.3)]">Aceptar carrera</button>
                </div>
              ))}

              <button onClick={simulateNewRequest} className="w-full rounded-xl bg-surface-container py-3 font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-400 border border-white/5">Simular nueva solicitud</button>
            </div>
          )}

          {rideState === "solicitada" && selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-tertiary animate-ping" /><span className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-tertiary">NUEVA SOLICITUD</span></div>
                <span className="font-[family-name:var(--font-geist-mono)] text-[18px] font-bold text-tertiary">{timerCountdown}s</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest"><div className="h-full rounded-full bg-tertiary transition-all duration-1000" style={{ width: `${(timerCountdown / 15) * 100}%` }} /></div>
              <div className="rounded-xl bg-surface-container p-4">
                <div className="flex items-center justify-between mb-3">
                  <div><p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white">{selectedRequest.clientName}</p><p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">★ {selectedRequest.rating.toFixed(1)}</p></div>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-secondary">{formatCurrency(selectedRequest.fare)}</p>
                </div>
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-3"><div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-secondary" /><div className="h-6 w-0.5 bg-neutral-700" /></div><div><p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Recoger en</p><p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-white">{selectedRequest.origin}</p></div></div>
                  <div className="flex items-center gap-3"><div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-error" /></div><div><p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Llegar a</p><p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-white">{selectedRequest.destination}</p></div></div>
                </div>
                <div className="mb-4 flex gap-4"><span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-300">{selectedRequest.distance} km</span></div>
                <div className="flex gap-3">
                  <button onClick={handleRejectRequest} className="flex-1 rounded-xl bg-neutral-800 py-3.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-neutral-400 transition-all active:scale-95">Rechazar</button>
                  <button onClick={handleAcceptRequest} className="flex-1 rounded-xl bg-secondary py-3.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-black transition-all active:scale-95 shadow-[0_0_20px_rgba(78,222,163,0.3)]">Aceptar</button>
                </div>
              </div>
            </div>
          )}

          {(rideState === "aceptada" || rideState === "en_curso") && selectedRequest && (
            <div className="rounded-xl bg-surface-container p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-white">{selectedRequest.clientName}</p>
                <div className="flex gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary"><span className="material-symbols-outlined text-[16px]">call</span></button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary"><span className="material-symbols-outlined text-[16px]">chat</span></button>
                </div>
              </div>
              <p className="font-[family-name:var(--font-geist-sans)] text-[11px] text-neutral-400">{rideState === "aceptada" ? `→ ${selectedRequest.origin}` : `→ ${selectedRequest.destination}`}</p>
              {rideState === "en_curso" && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-container-high p-3">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">Tarifa actual</span>
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[18px] font-bold text-secondary">{formatCurrency(fareAccumulated)}</span>
                </div>
              )}
            </div>
          )}

          {rideState === "completada" && selectedRequest && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20 mb-2">
                  <span className="material-symbols-outlined text-[28px] text-secondary">check_circle</span>
                </div>
                <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white">Carrera completada</p>
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-container-high p-3 text-center"><p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Distancia</p><p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white">{selectedRequest.distance} km</p></div>
                  <div className="rounded-lg bg-surface-container-high p-3 text-center"><p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Tarifa</p><p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-secondary">{formatCurrency(selectedRequest.fare)}</p></div>
                </div>
                <div className="mb-4 text-center">
                  <p className="mb-2 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase text-neutral-500">Califica al cliente</p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setStarRating(s)} className="transition-transform active:scale-110">
                        <span className={cn("material-symbols-outlined text-[28px]", s <= starRating ? "text-[#fbbf24]" : "text-neutral-600")}>{s <= starRating ? "star" : "star_border"}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleDone} className="w-full rounded-xl bg-secondary py-3.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-black transition-all active:scale-95">Cobrar y volver a disponible</button>
              </div>
            </div>
          )}

          {rideState === "disponible" && (
            <div>
              <p className="mb-3 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">Carreras recientes</p>
              <div className="space-y-2">
                {carrerasData.slice(0, 5).map((ride) => (
                  <div key={ride.id} className="rounded-xl bg-surface-container p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-[family-name:var(--font-geist-sans)] text-[12px] font-semibold text-white truncate">{ride.clientName}</p>
                          <Badge variant={ride.status === "COMPLETADA" ? "active" : ride.status === "CANCELADA" ? "overdue" : "warning"} className="flex-shrink-0">{ride.status}</Badge>
                        </div>
                        <p className="mt-0.5 font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-400 truncate">{ride.origin} → {ride.destination}</p>
                      </div>
                      <div className="ml-3 flex-shrink-0 text-right">
                        <p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">{formatCurrency(ride.total)}</p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-[9px] text-neutral-500">{ride.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
