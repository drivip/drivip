"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { choferProfile, choferStats } from "@/mockData/choferData";
import { pendingRequests } from "@/mockData/carrerasData";
import Toast from "@/components/ui/Toast";
import dynamic from "next/dynamic";
import useGeolocation from "@/hooks/useGeolocation";
import useReverseGeocoding from "@/hooks/useReverseGeocoding";
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

interface Props {
  onNavigate: (module: string) => void;
}

export default function ChoferDashboard({ onNavigate }: Props) {
  const [isOnline, setIsOnline] = useState(true);
  const [rideState, setRideState] = useState<RidePhase>("disponible");
  const [selectedRequest, setSelectedRequest] = useState<(typeof pendingRequests)[number] | null>(null);
  const [fareAccumulated, setFareAccumulated] = useState(0);
  const [timerCountdown, setTimerCountdown] = useState(15);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [activeTab, setActiveTab] = useState<"map" | "stats">("map");

  // Navigation state
  const [navRoute, setNavRoute] = useState<NavRoute | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingKm, setRemainingKm] = useState(0);
  const [remainingMin, setRemainingMin] = useState(0);
  const [arrived, setArrived] = useState(false);

  const { latitude, longitude, heading, isTracking, startTracking, stopTracking } = useGeolocation();
  const { result: geoResult, loading: addressLoading, reverse: reverseGeocoding } = useReverseGeocoding();

  const prevPosRef = useRef<[number, number] | null>(null);
  const computedBearingRef = useRef(0);
  const lastRecalcRef = useRef(0);

  const address = geoResult?.displayName || null;

  const driverCoords: [number, number] =
    isOnline && latitude && longitude ? [latitude, longitude] : DEFAULT_COORDS;

  // Calculate bearing from movement
  useEffect(() => {
    if (!latitude || !longitude) return;
    const cur: [number, number] = [latitude, longitude];
    if (prevPosRef.current) {
      computedBearingRef.current = calcBearing(prevPosRef.current, cur);
    }
    prevPosRef.current = cur;
  }, [latitude, longitude]);

  const carBearing = heading && heading > 0 ? heading : computedBearingRef.current;

  const carPosition = isOnline && isTracking && latitude && longitude
    ? { lat: driverCoords[0], lng: driverCoords[1], bearing: carBearing }
    : null;

  useEffect(() => {
    if (isOnline && latitude && longitude) {
      reverseGeocoding(latitude, longitude);
    }
  }, [isOnline, latitude, longitude, reverseGeocoding]);

  const dailyGoal = 5000;
  const dailyProgress = choferStats.today.earnings;

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

      // Check arrival
      if (distToDest < ARRIVAL_THRESHOLD) {
        setArrived(true);
        return;
      }

      // Check if off route
      const distToRoute = getDistanceToRoute(driverCoords, navRoute.geometry);
      if (distToRoute > OFF_ROUTE_THRESHOLD) {
        lastRecalcRef.current = now;
        fetchRoute(driverCoords, target).then((newRoute) => {
          if (newRoute) {
            setNavRoute(newRoute);
            setCurrentStepIdx(0);
          }
        });
        return;
      }

      // Update current step
      const nearestIdx = findNearestStepIndex(driverCoords, navRoute.steps);
      if (nearestIdx !== currentStepIdx) {
        setCurrentStepIdx(nearestIdx);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [navRoute, rideState, selectedRequest, driverCoords, currentStepIdx]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  }

  function handleToggleOnline() {
    const next = !isOnline;
    setIsOnline(next);
    if (next) {
      startTracking();
      setRideState("disponible");
      showToast("Online — GPS activo");
    } else {
      stopTracking();
      setRideState("disponible");
      setSelectedRequest(null);
      setFareAccumulated(0);
      setNavRoute(null);
      setArrived(false);
      showToast("Offline — GPS desactivado");
    }
  }

  function simulateNewRequest() {
    if (!isOnline || pendingRequests.length === 0) return;
    setSelectedRequest(pendingRequests[0]);
    setRideState("solicitada");
    setTimerCountdown(pendingRequests[0].timeLeft || 15);
    showToast("Nueva solicitud de carrera");
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

  const handleAcceptRequest = useCallback(async () => {
    if (!selectedRequest) return;
    setRideState("aceptada");
    setArrived(false);
    const route = await fetchRoute(driverCoords, [selectedRequest.originLat, selectedRequest.originLng]);
    if (route) {
      setNavRoute(route);
      setCurrentStepIdx(0);
    }
    showToast("Carrera aceptada — yendo al origen");
  }, [selectedRequest, driverCoords]);

  const handleRejectRequest = useCallback(() => {
    setSelectedRequest(null);
    setRideState("disponible");
    setTimerCountdown(15);
    setNavRoute(null);
    setArrived(false);
    showToast("Solicitud rechazada");
  }, []);

  const handleArrived = useCallback(async () => {
    if (!selectedRequest) return;
    setRideState("en_curso");
    setArrived(false);
    const route = await fetchRoute(
      [selectedRequest.originLat, selectedRequest.originLng],
      [selectedRequest.destinationLat, selectedRequest.destinationLng]
    );
    if (route) {
      setNavRoute(route);
      setCurrentStepIdx(0);
    }
    showToast("Cliente recogido — en camino al destino");
  }, [selectedRequest]);

  const handleFinalizeRide = useCallback(() => {
    setRideState("completada");
    setNavRoute(null);
    setArrived(false);
    showToast("Carrera completada");
  }, []);

  const handleMarkCollected = useCallback(() => {
    setRideState("disponible");
    setSelectedRequest(null);
    setFareAccumulated(0);
    setStarRating(0);
    setNavRoute(null);
    setArrived(false);
    showToast("Carrera cobrada — listo para nueva carrera");
  }, []);

  const mapCenter = carPosition
    ? [carPosition.lat, carPosition.lng] as [number, number]
    : rideState === "solicitada" && selectedRequest
      ? [selectedRequest.originLat, selectedRequest.originLng] as [number, number]
      : driverCoords;

  const mapRoute = navRoute?.geometry || undefined;

  const mapOrigin = rideState === "solicitada" && selectedRequest
    ? { lat: selectedRequest.originLat, lng: selectedRequest.originLng, label: "Origen" }
    : rideState === "aceptada" && selectedRequest
      ? { lat: selectedRequest.originLat, lng: selectedRequest.originLng, label: "Recoger" }
      : rideState === "en_curso" && selectedRequest
        ? { lat: selectedRequest.originLat, lng: selectedRequest.originLng, label: "Origen" }
        : null;

  const mapDest = selectedRequest
    ? { lat: selectedRequest.destinationLat, lng: selectedRequest.destinationLng, label: "Destino" }
    : null;

  const isNavigating = navRoute !== null && (rideState === "aceptada" || rideState === "en_curso") && !arrived;

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <Toast message={toastMsg} visible={toastVisible} />

      {/* FULL SCREEN MAP */}
      <div className="relative flex-1 min-h-0">
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
              {/* Main instruction */}
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

              {/* Route summary */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-neutral-500">route</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">
                      {remainingKm < 1
                        ? `${Math.round(remainingKm * 1000)}m`
                        : `${remainingKm.toFixed(1)}km`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-neutral-500">schedule</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">
                      ~{remainingMin} min
                    </span>
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

        {/* Top controls — when not navigating */}
        {!isNavigating && !arrived && (
          <div className="absolute top-4 left-4 right-4 z-[1000]">
            <div className="flex items-center justify-between">
              <button
                onClick={handleToggleOnline}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold shadow-lg backdrop-blur-md transition-all",
                  isOnline ? "bg-secondary/90 text-black" : "bg-neutral-800/90 text-neutral-400"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", isOnline ? "bg-black animate-pulse" : "bg-neutral-500")} />
                {isOnline ? "ONLINE" : "OFFLINE"}
              </button>
              {isOnline && isTracking && (
                <span className="rounded-full bg-surface/80 backdrop-blur-md px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-300 shadow-lg">
                  GPS activo
                </span>
              )}
            </div>
          </div>
        )}

        {/* Address bar — when not navigating */}
        {isOnline && !isNavigating && !arrived && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="rounded-xl bg-surface/90 backdrop-blur-md p-3 shadow-lg border border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
                <div className="flex-1 min-w-0">
                  {addressLoading ? (
                    <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-neutral-400">Obteniendo ubicación...</p>
                  ) : geoResult ? (
                    <>
                      <p className="font-[family-name:var(--font-space-grotesk)] text-[12px] font-bold text-white truncate">
                        {geoResult.street || "Vía actual"}
                      </p>
                      <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-400 truncate">
                        {geoResult.city}{geoResult.state ? `, ${geoResult.state}` : ""}
                      </p>
                    </>
                  ) : (
                    <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">
                      {driverCoords[0].toFixed(5)}, {driverCoords[1].toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM PANEL */}
      <div className="relative z-[1000] bg-surface rounded-t-3xl border-t border-white/5 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] flex-shrink-0">
        <div className="flex border-b border-white/5">
          <button onClick={() => setActiveTab("map")} className={cn("flex-1 py-3 font-[family-name:var(--font-space-grotesk)] text-[12px] font-bold uppercase tracking-wide transition-all", activeTab === "map" ? "text-primary border-b-2 border-primary" : "text-neutral-500")}>Carrera</button>
          <button onClick={() => setActiveTab("stats")} className={cn("flex-1 py-3 font-[family-name:var(--font-space-grotesk)] text-[12px] font-bold uppercase tracking-wide transition-all", activeTab === "stats" ? "text-primary border-b-2 border-primary" : "text-neutral-500")}>Resumen</button>
        </div>

        <div className="p-4 pb-24 max-h-[55vh] overflow-y-auto">

          {/* DISPONIBLE */}
          {activeTab === "map" && rideState === "disponible" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-surface-container p-4">
                <div>
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wide text-neutral-500">Ganancias hoy</p>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-secondary">{formatCurrency(dailyProgress)}</p>
                </div>
                <div className="text-right">
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wide text-neutral-500">Meta</p>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-neutral-400">{formatCurrency(dailyGoal)}</p>
                </div>
              </div>

              {isOnline ? (
                <div className="text-center py-6">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-3">
                    <span className="material-symbols-outlined text-[32px] text-primary animate-pulse">local_taxi</span>
                  </div>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-white">Buscando carreras...</p>
                  <p className="mt-1 font-[family-name:var(--font-geist-sans)] text-[12px] text-neutral-400">Tu posición GPS se muestra en el mapa</p>
                  <button onClick={simulateNewRequest} className="mt-4 rounded-lg bg-surface-container px-4 py-2 font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400 border border-white/5">Simular solicitud</button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-neutral-500">Estás offline</p>
                  <p className="mt-1 font-[family-name:var(--font-geist-sans)] text-[12px] text-neutral-500">Activa tu estado para recibir carreras</p>
                </div>
              )}
            </div>
          )}

          {/* SOLICITADA */}
          {activeTab === "map" && rideState === "solicitada" && selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-tertiary animate-ping" />
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-tertiary">NUEVA SOLICITUD</span>
                </div>
                <span className="font-[family-name:var(--font-geist-mono)] text-[16px] font-bold text-tertiary">{timerCountdown}s</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full rounded-full bg-tertiary transition-all duration-1000" style={{ width: `${(timerCountdown / 15) * 100}%` }} />
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white">{selectedRequest.clientName}</p>
                    <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">★ {selectedRequest.rating.toFixed(1)}</p>
                  </div>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-secondary">{formatCurrency(selectedRequest.fare)}</p>
                </div>
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-secondary" /><div className="h-6 w-0.5 bg-neutral-700" /></div>
                    <div><p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Recoger en</p><p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-white">{selectedRequest.origin}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-error" /></div>
                    <div><p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Llegar a</p><p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-white">{selectedRequest.destination}</p></div>
                  </div>
                </div>
                <div className="mb-4 flex gap-4">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-300">{selectedRequest.distance} km</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleRejectRequest} className="flex-1 rounded-xl bg-neutral-800 py-3.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-neutral-400 transition-all active:scale-95">Rechazar</button>
                  <button onClick={handleAcceptRequest} className="flex-1 rounded-xl bg-secondary py-3.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-black transition-all active:scale-95 shadow-[0_0_20px_rgba(78,222,163,0.3)]">Aceptar</button>
                </div>
              </div>
            </div>
          )}

          {/* ACEPTADA / EN CURSO */}
          {(rideState === "aceptada" || rideState === "en_curso") && selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-xl bg-surface-container p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-white">{selectedRequest.clientName}</p>
                  <div className="flex gap-2">
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary"><span className="material-symbols-outlined text-[16px]">call</span></button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary"><span className="material-symbols-outlined text-[16px]">chat</span></button>
                  </div>
                </div>
                <p className="font-[family-name:var(--font-geist-sans)] text-[11px] text-neutral-400">
                  {rideState === "aceptada" ? `→ ${selectedRequest.origin}` : `→ ${selectedRequest.destination}`}
                </p>
                {rideState === "en_curso" && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-container-high p-3">
                    <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">Tarifa actual</span>
                    <span className="font-[family-name:var(--font-space-grotesk)] text-[18px] font-bold text-secondary">{formatCurrency(fareAccumulated)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPLETADA */}
          {activeTab === "map" && rideState === "completada" && selectedRequest && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20 mb-2">
                  <span className="material-symbols-outlined text-[28px] text-secondary">check_circle</span>
                </div>
                <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white">Carrera completada</p>
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-container-high p-3 text-center">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Distancia</p>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-white">{selectedRequest.distance} km</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-high p-3 text-center">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase text-neutral-500">Tarifa</p>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-secondary">{formatCurrency(selectedRequest.fare)}</p>
                  </div>
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
                <button onClick={handleMarkCollected} className="w-full rounded-xl bg-secondary py-3.5 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-black transition-all active:scale-95">Cobrar y volver a disponible</button>
              </div>
            </div>
          )}

          {/* STATS */}
          {activeTab === "stats" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-surface-container p-4">
                <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Ganancias de hoy</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-bold text-secondary">{formatCurrency(dailyProgress)}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${Math.min((dailyProgress / dailyGoal) * 100, 100)}%` }} />
                </div>
                <p className="mt-1 font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">Meta: {formatCurrency(dailyGoal)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-container p-4 text-center">
                  <span className="material-symbols-outlined text-[20px] text-primary">local_taxi</span>
                  <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-white">{choferStats.today.trips}</p>
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">Carreras hoy</p>
                </div>
                <div className="rounded-xl bg-surface-container p-4 text-center">
                  <span className="material-symbols-outlined text-[20px] text-[#fbbf24]">star</span>
                  <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-white">{choferProfile.rating}</p>
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">Calificación</p>
                </div>
                <div className="rounded-xl bg-surface-container p-4 text-center">
                  <span className="material-symbols-outlined text-[20px] text-secondary">schedule</span>
                  <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-white">{choferStats.today.activeHours}h</p>
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">Tiempo activo</p>
                </div>
                <div className="rounded-xl bg-surface-container p-4 text-center">
                  <span className="material-symbols-outlined text-[20px] text-tertiary">trending_up</span>
                  <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-white">{formatCurrency(choferStats.today.avgPerTrip)}</p>
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">Promedio/carrera</p>
                </div>
              </div>
              <button onClick={() => onNavigate("perfil")} className="w-full rounded-xl bg-surface-container p-4 flex items-center gap-3 text-left">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-symbols-outlined text-[18px] text-primary">person</span></div>
                <div className="flex-1"><p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">{choferProfile.name}</p><p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">Ver perfil completo</p></div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
