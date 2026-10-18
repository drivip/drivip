"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    color: string;
    label: string;
    icon?: string;
  }>;
  route?: [number, number][];
  coverageRadius?: number;
  onMarkerClick?: (id: string) => void;
  carPosition?: { lat: number; lng: number; bearing: number } | null;
}

let carIconCounter = 0;

function createCarIcon3D(bearing: number): L.DivIcon {
  const uid = `car3d-${++carIconCounter}`;

  const html = `
    <div style="
      position: relative;
      width: 56px; height: 56px;
      display: flex; align-items: center; justify-content: center;
    ">
      <!-- Shadow on ground -->
      <div style="
        position: absolute; bottom: 2px; left: 50%;
        transform: translateX(-50%);
        width: 38px; height: 10px;
        border-radius: 50%;
        background: radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%);
        filter: blur(2px);
      "></div>

      <!-- Car body with rotation -->
      <div style="
        position: relative;
        width: 48px; height: 48px;
        transform: rotate(${bearing}deg);
        transition: transform 0.5s cubic-bezier(.25,.1,.25,1);
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
      ">
        <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
          <defs>
            <linearGradient id="${uid}-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#9333ea"/>
              <stop offset="100%" stop-color="#6b21a8"/>
            </linearGradient>
            <linearGradient id="${uid}-roof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a855f7"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
            <linearGradient id="${uid}-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#1e293b"/>
            </linearGradient>
            <radialGradient id="${uid}-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(0,0,0,0.25)"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>

          <!-- Car body main -->
          <rect x="8" y="14" width="32" height="22" rx="7" fill="url(#${uid}-body)" stroke="#4c1d95" stroke-width="0.8"/>

          <!-- Body top highlight -->
          <rect x="10" y="15" width="28" height="6" rx="4" fill="white" opacity="0.12"/>

          <!-- Roof -->
          <rect x="13" y="9" width="22" height="15" rx="5" fill="url(#${uid}-roof)" stroke="#4c1d95" stroke-width="0.5"/>

          <!-- Roof highlight -->
          <rect x="15" y="10" width="18" height="4" rx="3" fill="white" opacity="0.18"/>

          <!-- Windshield front -->
          <rect x="15" y="11" width="18" height="5" rx="2.5" fill="url(#${uid}-glass)"/>
          <rect x="16" y="11.5" width="16" height="1.5" rx="1" fill="white" opacity="0.08"/>

          <!-- Windshield rear -->
          <rect x="15" y="18" width="18" height="4" rx="2" fill="url(#${uid}-glass)" opacity="0.75"/>

          <!-- Side windows -->
          <rect x="9" y="16" width="4" height="7" rx="1.5" fill="url(#${uid}-glass)" opacity="0.5"/>
          <rect x="35" y="16" width="4" height="7" rx="1.5" fill="url(#${uid}-glass)" opacity="0.5"/>

          <!-- Headlights -->
          <rect x="8" y="19" width="3" height="4" rx="1.5" fill="#facc15"/>
          <rect x="37" y="19" width="3" height="4" rx="1.5" fill="#facc15"/>
          <circle cx="9.5" cy="21" r="1.2" fill="#fef08a" opacity="0.7"/>
          <circle cx="38.5" cy="21" r="1.2" fill="#fef08a" opacity="0.7"/>

          <!-- Taillights -->
          <rect x="8" y="29" width="3" height="3" rx="1" fill="#ef4444"/>
          <rect x="37" y="29" width="3" height="3" rx="1" fill="#ef4444"/>

          <!-- Wheels -->
          <ellipse cx="14" cy="36" rx="3.5" ry="3" fill="#111827"/>
          <ellipse cx="14" cy="35.5" rx="2" ry="1.5" fill="#374151"/>
          <ellipse cx="14" cy="35" rx="0.8" ry="0.6" fill="#6b7280"/>

          <ellipse cx="34" cy="36" rx="3.5" ry="3" fill="#111827"/>
          <ellipse cx="34" cy="35.5" rx="2" ry="1.5" fill="#374151"/>
          <ellipse cx="34" cy="35" rx="0.8" ry="0.6" fill="#6b7280"/>

          <ellipse cx="14" cy="14" rx="3.5" ry="3" fill="#111827"/>
          <ellipse cx="14" cy="13.5" rx="2" ry="1.5" fill="#374151"/>

          <ellipse cx="34" cy="14" rx="3.5" ry="3" fill="#111827"/>
          <ellipse cx="34" cy="13.5" rx="2" ry="1.5" fill="#374151"/>

          <!-- Taxi sign -->
          <rect x="20" y="6" width="8" height="4" rx="2" fill="#facc15"/>
          <rect x="21" y="6.5" width="6" height="2" rx="1" fill="#fef9c3" opacity="0.5"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

export default function MapView({
  center,
  zoom = 17,
  className = "",
  markers = [],
  route,
  coverageRadius,
  onMarkerClick,
  carPosition,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const routeLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const coverageLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const carLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef(zoom);
  const followingRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current.addTo(map);
    routeLayerRef.current.addTo(map);
    coverageLayerRef.current.addTo(map);
    carLayerRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Auto-follow car when carPosition changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (carPosition) {
      mapInstanceRef.current.flyTo(
        [carPosition.lat, carPosition.lng],
        Math.max(mapInstanceRef.current.getZoom(), 17),
        { duration: 0.8 }
      );
      followingRef.current = true;
    }
  }, [carPosition]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (followingRef.current) return;
    const prev = prevCenterRef.current;
    if (
      prev[0] !== center[0] ||
      prev[1] !== center[1] ||
      prevZoomRef.current !== zoom
    ) {
      mapInstanceRef.current.setView(center, zoom);
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: ${m.color}; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: bold; font-size: 12px;
        "><span class="material-symbols-outlined" style="font-size:16px">${m.icon || "place"}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([m.lat, m.lng], { icon })
        .bindPopup(`<div style="font-family:sans-serif;font-size:13px">${m.label}</div>`)
        .on("click", () => onMarkerClick?.(m.id))
        .addTo(markersLayerRef.current);
    });
  }, [markers, onMarkerClick]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    routeLayerRef.current.clearLayers();

    if (route && route.length > 1) {
      L.polyline(route, {
        color: "#7c3aed",
        weight: 7,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeLayerRef.current);

      L.polyline(route, {
        color: "#c4b5fd",
        weight: 14,
        opacity: 0.15,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeLayerRef.current);
    }
  }, [route]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    coverageLayerRef.current.clearLayers();

    if (coverageRadius) {
      L.circle(center, {
        radius: coverageRadius,
        color: "#7c3aed",
        fillColor: "#7c3aed",
        fillOpacity: 0.08,
        weight: 1,
        dashArray: "6 4",
      }).addTo(coverageLayerRef.current);
    }
  }, [center, coverageRadius]);

  // 3D Car marker from real GPS
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    carLayerRef.current.clearLayers();

    if (carPosition) {
      const icon = createCarIcon3D(carPosition.bearing);

      L.marker([carPosition.lat, carPosition.lng], { icon, interactive: false })
        .addTo(carLayerRef.current);
    }
  }, [carPosition]);

  return (
    <div
      ref={mapRef}
      className={`w-full overflow-hidden ${className}`}
      style={{ minHeight: "200px" }}
    />
  );
}
