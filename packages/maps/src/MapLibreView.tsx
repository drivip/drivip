import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapLibreViewProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  mapStyle?: string;
  carPosition?: { lat: number; lng: number; bearing: number } | null;
  route?: [number, number][];
  routeSecondary?: [number, number][];
  traveledRoute?: [number, number][];
  destination?: { lat: number; lng: number; label?: string } | null;
  origin?: { lat: number; lng: number; label?: string } | null;
  showPulse?: boolean;
  /** Solo se llama cuando el usuario mueve el mapa, no en movimientos programáticos. */
  onCenterChange?: (center: [number, number]) => void;
  /** Límites geográficos, en formato [[oeste, sur], [este, norte]]. */
  maxBounds?: [[number, number], [number, number]] | null;
  /** Permite desactivar gestos para usar el mapa como vista previa. */
  interactive?: boolean;
}

let uid = 0;

function makeOrangePulseMarker(): HTMLDivElement {
  const id = `pulse-${++uid}`;
  const el = document.createElement("div");
  el.style.cssText = "width:40px;height:40px;display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `
    <style>
      @keyframes ${id}-pulse {
        0% { transform: scale(0.8); opacity: 0.8; }
        50% { transform: scale(2.2); opacity: 0; }
        100% { transform: scale(0.8); opacity: 0; }
      }
    </style>
    <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(255,119,51,0.25);animation:${id}-pulse 2s ease-out infinite;"></div>
    <div style="width:16px;height:16px;border-radius:50%;background:#FF7733;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);position:relative;z-index:1;"></div>
  `;
  return el;
}

function makeCarMarker(): HTMLDivElement {
  const id = `c${++uid}`;
  const el = document.createElement("div");
  el.style.cssText = "width:56px;height:56px;display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:32px;height:8px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,0.4),transparent 70%);filter:blur(2px)"></div>
    <div id="${id}" style="width:48px;height:48px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.5));transition:transform .5s cubic-bezier(.25,.1,.25,1)">
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9333ea"/><stop offset="100%" stop-color="#6b21a8"/></linearGradient>
          <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
          <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient>
        </defs>
        <rect x="8" y="14" width="32" height="22" rx="7" fill="url(#${id}b)" stroke="#4c1d95" stroke-width=".8"/>
        <rect x="10" y="15" width="28" height="6" rx="4" fill="#fff" opacity=".12"/>
        <rect x="13" y="9" width="22" height="15" rx="5" fill="url(#${id}r)" stroke="#4c1d95" stroke-width=".5"/>
        <rect x="15" y="10" width="18" height="4" rx="3" fill="#fff" opacity=".18"/>
        <rect x="15" y="11" width="18" height="5" rx="2.5" fill="url(#${id}g)"/>
        <rect x="15" y="18" width="18" height="4" rx="2" fill="url(#${id}g)" opacity=".75"/>
        <rect x="9" y="16" width="4" height="7" rx="1.5" fill="url(#${id}g)" opacity=".5"/>
        <rect x="35" y="16" width="4" height="7" rx="1.5" fill="url(#${id}g)" opacity=".5"/>
        <rect x="8" y="19" width="3" height="4" rx="1.5" fill="#facc15"/>
        <rect x="37" y="19" width="3" height="4" rx="1.5" fill="#facc15"/>
        <rect x="8" y="29" width="3" height="3" rx="1" fill="#ef4444"/>
        <rect x="37" y="29" width="3" height="3" rx="1" fill="#ef4444"/>
        <ellipse cx="14" cy="36" rx="3.5" ry="3" fill="#111827"/>
        <ellipse cx="14" cy="35.5" rx="2" ry="1.5" fill="#374151"/>
        <ellipse cx="34" cy="36" rx="3.5" ry="3" fill="#111827"/>
        <ellipse cx="34" cy="35.5" rx="2" ry="1.5" fill="#374151"/>
        <ellipse cx="14" cy="14" rx="3.5" ry="3" fill="#111827"/>
        <ellipse cx="34" cy="14" rx="3.5" ry="3" fill="#111827"/>
        <rect x="20" y="6" width="8" height="4" rx="2" fill="#facc15"/>
        <rect x="21" y="6.5" width="6" height="2" rx="1" fill="#fef9c3" opacity=".5"/>
      </svg>
    </div>
  `;
  return el;
}

function makeDot(color: string, icon: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;";
  el.style.background = color;
  el.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;color:white">${icon}</span>`;
  return el;
}

function toGeoJSON(coords: [number, number][]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: coords.length > 1 ? [{
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords.map(p => [p[1], p[0]]) },
      properties: {},
    }] : [],
  };
}

export default function MapLibreView({
  center,
  zoom = 17,
  className = "",
  mapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  carPosition,
  route,
  routeSecondary,
  traveledRoute,
  destination,
  origin,
  showPulse = true,
  onCenterChange,
  maxBounds,
  interactive = true,
}: MapLibreViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const carMarkerRef = useRef<maplibregl.Marker | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const loadedRef = useRef(false);
  const pendingRouteRef = useRef<[number, number][] | null>(null);
  const pendingRouteSecRef = useRef<[number, number][] | null>(null);
  const pendingTraveledRef = useRef<[number, number][] | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  onCenterChangeRef.current = onCenterChange;
  const userDraggingRef = useRef(false);
  const programmaticMoveRef = useRef(false);
  const maxBoundsRef = useRef(maxBounds);
  maxBoundsRef.current = maxBounds;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [center[1], center[0]],
      zoom,
      attributionControl: false,
      renderWorldCopies: false,
      interactive,
      ...(maxBounds ? { maxBounds } : {}),
    });

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
    }

    map.on("load", () => {
      loadedRef.current = true;

      // Traveled route (gray)
      map.addSource("traveled-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route-traveled", type: "line", source: "traveled-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#94A3B8", "line-width": 4, "line-opacity": 0.5 },
      });

      // Main route (purple) - trip route
      map.addSource("route-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route-glow", type: "line", source: "route-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#9333EA", "line-width": 12, "line-opacity": 0.25 },
      });
      map.addLayer({
        id: "route-main", type: "line", source: "route-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#6B21A8", "line-width": 5, "line-opacity": 0.95 },
      });
      map.addLayer({
        id: "route-dash", type: "line", source: "route-src",
        layout: { "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 2, "line-opacity": 0.2, "line-dasharray": [0, 4, 3] },
      });

      // Secondary route (yellow) - to pickup
      map.addSource("route-sec-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route-sec-glow", type: "line", source: "route-sec-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#FACC15", "line-width": 12, "line-opacity": 0.3 },
      });
      map.addLayer({
        id: "route-sec-main", type: "line", source: "route-sec-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#EAB308", "line-width": 5, "line-opacity": 0.95 },
      });
      map.addLayer({
        id: "route-sec-dash", type: "line", source: "route-sec-src",
        layout: { "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 2, "line-opacity": 0.3, "line-dasharray": [0, 6, 4] },
      });

      // Apply pending data
      if (pendingTraveledRef.current && pendingTraveledRef.current.length > 1) {
        const src = map.getSource("traveled-src") as maplibregl.GeoJSONSource;
        if (src) src.setData(toGeoJSON(pendingTraveledRef.current));
      }
      if (pendingRouteRef.current && pendingRouteRef.current.length > 1) {
        const src = map.getSource("route-src") as maplibregl.GeoJSONSource;
        if (src) src.setData(toGeoJSON(pendingRouteRef.current));
      }
      if (pendingRouteSecRef.current && pendingRouteSecRef.current.length > 1) {
        const src = map.getSource("route-sec-src") as maplibregl.GeoJSONSource;
        if (src) src.setData(toGeoJSON(pendingRouteSecRef.current));
      }
    });
    map.on("dragstart", () => { userDraggingRef.current = true; });
    map.on("zoomstart", (event) => {
      if (event.originalEvent) userDraggingRef.current = true;
    });
    map.on("moveend", () => {
      const wasProgrammatic = programmaticMoveRef.current;
      const wasUser = userDraggingRef.current;
      programmaticMoveRef.current = false;
      userDraggingRef.current = false;
      if (wasProgrammatic || !wasUser) return;
      if (onCenterChangeRef.current) {
        const c = map.getCenter();
        onCenterChangeRef.current([c.lat, c.lng]);
      }
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || userDraggingRef.current) return;
    const targetZoom = Math.max(map.getZoom(), zoom);
    const current = map.getCenter();
    const centerMoved = Math.abs(current.lat - center[0]) + Math.abs(current.lng - center[1]);
    if (centerMoved < 0.00008 && Math.abs(map.getZoom() - targetZoom) < 0.05) {
      return;
    }
    programmaticMoveRef.current = true;
    map.easeTo({ center: [center[1], center[0]], zoom: targetZoom, duration: 500 });
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setMaxBounds(maxBounds ?? null);
  }, [maxBounds]);

  // Main route (purple)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) { pendingRouteRef.current = route || null; return; }
    const src = map.getSource("route-src") as maplibregl.GeoJSONSource | undefined;
    if (!src) { pendingRouteRef.current = route || null; return; }
    pendingRouteRef.current = null;
    src.setData(toGeoJSON(route || []));
  }, [route]);

  // Secondary route (yellow)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) { pendingRouteSecRef.current = routeSecondary || null; return; }
    const src = map.getSource("route-sec-src") as maplibregl.GeoJSONSource | undefined;
    if (!src) { pendingRouteSecRef.current = routeSecondary || null; return; }
    pendingRouteSecRef.current = null;
    src.setData(toGeoJSON(routeSecondary || []));
  }, [routeSecondary]);

  // Traveled route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) { pendingTraveledRef.current = traveledRoute || null; return; }
    const src = map.getSource("traveled-src") as maplibregl.GeoJSONSource | undefined;
    if (!src) { pendingTraveledRef.current = traveledRoute || null; return; }
    pendingTraveledRef.current = null;
    src.setData(toGeoJSON(traveledRoute || []));
  }, [traveledRoute]);

  // Car marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!carPosition) {
      carMarkerRef.current?.remove();
      carMarkerRef.current = null;
      return;
    }
    if (!carMarkerRef.current) {
      const el = showPulse ? makeOrangePulseMarker() : makeCarMarker();
      carMarkerRef.current = new maplibregl.Marker({ element: el, rotation: 0, anchor: "center" })
        .setLngLat([carPosition.lng, carPosition.lat])
        .addTo(map);
    } else {
      carMarkerRef.current.setLngLat([carPosition.lng, carPosition.lat]).setRotation(carPosition.bearing);
    }
  }, [carPosition, showPulse]);

  // Origin marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!origin) { originMarkerRef.current?.remove(); originMarkerRef.current = null; return; }
    if (!originMarkerRef.current) {
      const el = makeDot("#22C55E", "radio_button_checked");
      originMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([origin.lng, origin.lat]).addTo(map);
    } else {
      originMarkerRef.current.setLngLat([origin.lng, origin.lat]);
    }
  }, [origin]);

  // Destination marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!destination) { destMarkerRef.current?.remove(); destMarkerRef.current = null; return; }
    if (!destMarkerRef.current) {
      const el = makeDot("#EF4444", "location_on");
      destMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([destination.lng, destination.lat]).addTo(map);
    } else {
      destMarkerRef.current.setLngLat([destination.lng, destination.lat]);
    }
  }, [destination]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", minHeight: "200px", backgroundColor: "#000000" }}
    />
  );
}
