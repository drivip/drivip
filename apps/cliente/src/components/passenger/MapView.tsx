import { MapLibreView } from "@drivip/maps";
import { useGeolocation } from "@drivip/maps";
import { useEffect, useState } from "react";

const VOYAGER_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const CARACAS_CENTER: [number, number] = [10.4806, -66.9036];

interface MapViewProps {
  origin: [number, number] | null;
  destination: [number, number] | null;
  route: [number, number][];
  traveledRoute?: [number, number][];
  conductorPosition: { lat: number; lng: number; bearing: number } | null;
  onRecenter?: () => void;
  className?: string;
}

export default function MapView({
  origin,
  destination,
  route,
  traveledRoute,
  conductorPosition,
  onRecenter,
  className = "",
}: MapViewProps) {
  const { latitude, longitude, isTracking, startTracking } = useGeolocation();
  const [center, setCenter] = useState<[number, number]>(CARACAS_CENTER);

  useEffect(() => {
    startTracking();
  }, []);

  useEffect(() => {
    if (isTracking && latitude && longitude) {
      setCenter([latitude, longitude]);
    }
  }, [latitude, longitude, isTracking]);

  const effectiveOrigin = origin || (latitude && longitude ? [latitude, longitude] as [number, number] : null);

  return (
    <div className={`relative ${className}`} style={{ position: "absolute", inset: 0 }}>
      <MapLibreView
        center={center}
        zoom={15}
        mapStyle={VOYAGER_STYLE}
        origin={effectiveOrigin ? { lat: effectiveOrigin[0], lng: effectiveOrigin[1], label: "Tu ubicación" } : null}
        destination={destination ? { lat: destination[0], lng: destination[1], label: "Destino" } : null}
        route={route.length > 1 ? route : undefined}
        traveledRoute={traveledRoute && traveledRoute.length > 1 ? traveledRoute : undefined}
        carPosition={conductorPosition}
        showPulse={!conductorPosition}
      />

      {/* Botón re-centrar */}
      <button
        onClick={() => {
          if (latitude && longitude) setCenter([latitude, longitude]);
          onRecenter?.();
        }}
        className="absolute bottom-24 right-4 z-20 w-11 h-11 rounded-full bg-white shadow-lg shadow-slate-300/50 border border-slate-200 flex items-center justify-center active:scale-90 transition-transform"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Badge de ubicación */}
      {isTracking && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-slate-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-slate-600">GPS Activo</span>
        </div>
      )}
    </div>
  );
}
