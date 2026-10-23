import { useEffect, useState, useRef } from "react";
import { MapLibreView, useGeolocation, useReverseGeocoding, fetchRoute, haversineKm, calcBearing, getDistanceToRoute, findNearestStepIndex, getIconForManeuver, type NavRoute, type NavStep } from "@drivip/maps";

const VOYAGER_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const CARACAS_CENTER: [number, number] = [10.4806, -66.9036];
const OFF_ROUTE_THRESHOLD = 50;
const ARRIVAL_THRESHOLD = 0.03;

interface DriverMapViewProps {
  isOnline: boolean;
  pickupCoords?: [number, number] | null;
  destinationCoords?: [number, number] | null;
  ridePhase?: "idle" | "going_to_pickup" | "at_pickup" | "in_trip" | "at_destination";
  onArrivedAtDestination?: () => void;
}

export default function DriverMapView({
  isOnline,
  pickupCoords = null,
  destinationCoords = null,
  ridePhase = "idle",
  onArrivedAtDestination,
}: DriverMapViewProps) {
  const { latitude, longitude, heading, isTracking, startTracking, stopTracking } = useGeolocation();
  const { result: geoResult, loading: addressLoading, reverse: reverseGeocoding } = useReverseGeocoding();

  const [pickupRoute, setPickupRoute] = useState<[number, number][] | null>(null);
  const [tripRoute, setTripRoute] = useState<[number, number][] | null>(null);
  const [remainingKm, setRemainingKm] = useState(0);
  const [remainingMin, setRemainingMin] = useState(0);
  const [currentStep, setCurrentStep] = useState<NavStep | null>(null);
  const [arrived, setArrived] = useState(false);
  const [traveledRoute, setTraveledRoute] = useState<[number, number][]>([]);

  const pickupRouteRef = useRef<NavRoute | null>(null);
  const tripRouteRef = useRef<NavRoute | null>(null);
  const prevPosRef = useRef<[number, number] | null>(null);
  const computedBearingRef = useRef(0);
  const lastRecalcRef = useRef(0);
  const lastGeocodeRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const ridePhaseRef = useRef(ridePhase);
  ridePhaseRef.current = ridePhase;

  const driverCoords: [number, number] =
    isOnline && latitude && longitude ? [latitude, longitude] : CARACAS_CENTER;

  useEffect(() => {
    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [isOnline, startTracking, stopTracking]);

  useEffect(() => {
    if (!latitude || !longitude) return;
    const cur: [number, number] = [latitude, longitude];
    if (prevPosRef.current) {
      computedBearingRef.current = calcBearing(prevPosRef.current, cur);
    }
    prevPosRef.current = cur;
  }, [latitude, longitude]);

  useEffect(() => {
    if (ridePhase !== "in_trip" || !latitude || !longitude) return;
    setTraveledRoute((prev) => {
      const last = prev[prev.length - 1];
      const point: [number, number] = [latitude, longitude];
      if (last && haversineKm(last, point) < 0.012) return prev;
      return [...prev, point].slice(-900);
    });
  }, [ridePhase, latitude, longitude]);

  useEffect(() => {
    if (ridePhase === "idle" || ridePhase === "going_to_pickup") setTraveledRoute([]);
  }, [ridePhase]);

  useEffect(() => {
    if (!isOnline || !latitude || !longitude) return;

    const now = Date.now();
    const last = lastGeocodeRef.current;
    const movedKm = last
      ? haversineKm([last.lat, last.lng], [latitude, longitude])
      : Infinity;
    if (last && movedKm < 0.1 && now - last.at < 30000) return;

    lastGeocodeRef.current = { lat: latitude, lng: longitude, at: now };
    reverseGeocoding(latitude, longitude);
  }, [isOnline, latitude, longitude, reverseGeocoding]);

  const carBearing = heading && heading > 0 ? heading : computedBearingRef.current;

  const carPosition = isOnline && isTracking && latitude && longitude
    ? { lat: driverCoords[0], lng: driverCoords[1], bearing: carBearing }
    : null;

  // Compute routes when phase changes
  useEffect(() => {
    if (ridePhase === "going_to_pickup" && pickupCoords) {
      // Yellow route: driver -> pickup
      fetchRoute(driverCoords, pickupCoords).then((route) => {
        if (route) {
          pickupRouteRef.current = route;
          setPickupRoute(route.geometry);
          setRemainingKm(route.totalDistance / 1000);
          setRemainingMin(Math.max(1, Math.round((route.totalDistance / 1000) * 3)));
          setCurrentStep(route.steps[0] || null);
        }
      });
      setTripRoute(null);
      tripRouteRef.current = null;
      setArrived(false);
    } else if (ridePhase === "in_trip" && pickupCoords && destinationCoords) {
      // Purple route: pickup -> destination
      setPickupRoute(null);
      pickupRouteRef.current = null;
      fetchRoute(pickupCoords, destinationCoords).then((route) => {
        if (route) {
          tripRouteRef.current = route;
          setTripRoute(route.geometry);
          setRemainingKm(route.totalDistance / 1000);
          setRemainingMin(Math.max(1, Math.round((route.totalDistance / 1000) * 3)));
          setCurrentStep(route.steps[0] || null);
        }
      });
      setArrived(false);
    } else if (ridePhase !== "at_destination") {
      setPickupRoute(null);
      setTripRoute(null);
      pickupRouteRef.current = null;
      tripRouteRef.current = null;
      setCurrentStep(null);
      setArrived(false);
    }
  }, [ridePhase, pickupCoords?.[0], pickupCoords?.[1], destinationCoords?.[0], destinationCoords?.[1]]);

  // Navigation tracking
  useEffect(() => {
    const activeRoute = ridePhaseRef.current === "going_to_pickup" ? pickupRouteRef.current : tripRouteRef.current;
    if (!activeRoute) return;

    const target = ridePhaseRef.current === "going_to_pickup" ? pickupCoords : destinationCoords;
    if (!target) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastRecalcRef.current < 5000) return;

      const distToDest = haversineKm(driverCoords, target);
      setRemainingKm(distToDest);
      setRemainingMin(Math.max(1, Math.round(distToDest * 3)));

      if (distToDest < ARRIVAL_THRESHOLD) {
        setArrived(true);
        if (ridePhaseRef.current === "in_trip" && onArrivedAtDestination) {
          onArrivedAtDestination();
        }
        return;
      }

      const distToRoute = getDistanceToRoute(driverCoords, activeRoute.geometry);
      if (distToRoute > OFF_ROUTE_THRESHOLD) {
        lastRecalcRef.current = now;
        fetchRoute(driverCoords, target).then((newRoute) => {
          if (newRoute) {
            if (ridePhaseRef.current === "going_to_pickup") {
              pickupRouteRef.current = newRoute;
              setPickupRoute(newRoute.geometry);
            } else {
              tripRouteRef.current = newRoute;
              setTripRoute(newRoute.geometry);
            }
            setCurrentStep(newRoute.steps[0] || null);
          }
        });
        return;
      }

      const nearestIdx = findNearestStepIndex(driverCoords, activeRoute.steps);
      if (nearestIdx !== activeRoute.steps.indexOf(currentStep!)) {
        setCurrentStep(activeRoute.steps[nearestIdx] || null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pickupRoute, tripRoute, driverCoords[0], driverCoords[1], ridePhase]);

  const mapCenter: [number, number] = carPosition
    ? [carPosition.lat, carPosition.lng]
    : pickupCoords || CARACAS_CENTER;

  const isNavigating = (ridePhase === "going_to_pickup" || ridePhase === "in_trip") && !arrived;

  return (
    <div className="absolute inset-0">
      <MapLibreView
        center={mapCenter}
        zoom={16}
        mapStyle={VOYAGER_STYLE}
        carPosition={carPosition}
        route={tripRoute ?? undefined}
        routeSecondary={pickupRoute ?? undefined}
        traveledRoute={traveledRoute.length > 1 ? traveledRoute : undefined}
        origin={pickupCoords ? { lat: pickupCoords[0], lng: pickupCoords[1], label: "Recoger" } : null}
        destination={destinationCoords ? { lat: destinationCoords[0], lng: destinationCoords[1], label: "Destino" } : null}
        showPulse={!carPosition}
      />

      {isOnline && isTracking && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-slate-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-600">GPS</span>
        </div>
      )}

      {isOnline && !addressLoading && geoResult && !isNavigating && (
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-purple-600">my_location</span>
              <p className="text-[10px] font-bold text-slate-900 truncate">{geoResult.street || "Vía actual"}</p>
            </div>
          </div>
        </div>
      )}

      {isNavigating && currentStep && (
        <div className="absolute top-0 left-0 right-0 z-30">
          <div className="bg-gradient-to-b from-black/85 to-black/60 backdrop-blur-md px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                ridePhase === "going_to_pickup" ? "bg-yellow-500" : "bg-purple-600"
              }`}>
                <span className="material-symbols-outlined text-[20px] text-white">
                  {getIconForManeuver(currentStep.type, currentStep.modifier)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentStep.instruction}</p>
                {currentStep.streetName && (
                  <p className="text-[10px] text-neutral-400 truncate">en {currentStep.streetName}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-base font-black ${
                  ridePhase === "going_to_pickup" ? "text-yellow-400" : "text-emerald-400"
                }`}>
                  {currentStep.distance < 1000
                    ? `${Math.round(currentStep.distance)}m`
                    : `${(currentStep.distance / 1000).toFixed(1)}km`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1.5 pt-1.5 border-t border-white/10">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px] text-neutral-500">route</span>
                <span className="text-[10px] font-medium text-neutral-300">
                  {remainingKm < 1 ? `${Math.round(remainingKm * 1000)}m` : `${remainingKm.toFixed(1)}km`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px] text-neutral-500">schedule</span>
                <span className="text-[10px] font-medium text-neutral-300">~{remainingMin} min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {arrived && (
        <div className="pointer-events-none absolute inset-x-3 top-[calc(4.75rem+env(safe-area-inset-top))] z-30 flex justify-center">
          <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900">
                {ridePhase === "going_to_pickup" ? "Llegaste al pasajero" : "Llegaste al destino"}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                {ridePhase === "going_to_pickup" ? "Marca la llegada y recoge al cliente" : "Confirma el cobro para completar el viaje"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px] text-slate-300">wifi_off</span>
            <p className="text-sm font-bold text-slate-500 mt-2">Estás offline</p>
            <p className="text-xs text-slate-400">Actívate para ver el mapa</p>
          </div>
        </div>
      )}
    </div>
  );
}
