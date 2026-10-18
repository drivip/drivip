import { useState, useEffect, useRef, useCallback } from "react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { MapLibreView } from "@drivip/maps";

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const OSRM_BASE = "https://router.project-osrm.org";
const DEFAULT_CENTER: [number, number] = [10.491, -66.881];

const NOMINATIM_INSTANCES = [
  "https://nominatim.openstreetmap.org",
];

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseGps: () => void;
  onConfirmPin: (address: string, point: "origin" | "destination") => void;
  onConfirmRoute?: (
    origin: { lat: number; lng: number; address: string },
    stops: { lat: number; lng: number; address: string }[],
    destination: { lat: number; lng: number; address: string },
    totalKm: number,
    totalMin: number
  ) => void;
  initialOrigin?: { lat: number; lng: number; address: string } | null;
  pointType?: "origin" | "destination";
}

async function osrmRoute(
  waypoints: { lat: number; lng: number }[]
): Promise<{ geometry: [number, number][]; distanceKm: number; durationMin: number } | null> {
  if (waypoints.length < 2) return null;
  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
  try {
    const res = await fetch(`${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;
    const route = data.routes[0];
    return {
      geometry: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch { return null; }
}

export default function MapPickerModal({
  isOpen, onClose, onUseGps, onConfirmPin, onConfirmRoute,
  initialOrigin, pointType: initialPointType = "origin",
}: MapPickerModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [extraStops, setExtraStops] = useState<{ lat: number; lng: number; address: string }[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [totalKm, setTotalKm] = useState(0);
  const [totalMin, setTotalMin] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchIdRef = useRef(0);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(""); setSelectedAddress(""); setSelectedCoords(null);
    setExtraStops([]); setRouteGeometry(null); setTotalKm(0); setTotalMin(0);
    setResults([]); setSearchError("");
    if (initialPointType === "destination" && initialOrigin) {
      setCenter([initialOrigin.lat, initialOrigin.lng]);
    } else {
      setCenter(DEFAULT_CENTER);
    }
  }, [isOpen]);

  const searchNominatim = useCallback(async (q: string): Promise<GeocodingResult[]> => {
    const results: GeocodingResult[] = [];
    for (const base of NOMINATIM_INSTANCES) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const params = new URLSearchParams({
          q, format: "jsonv2", limit: "8", "accept-language": "es", addressdetails: "1",
          viewbox: "-73.5,5,-59.5,12.5", bounded: "0",
        });
        const res = await fetch(`${base}/search?${params}`, {
          headers: { "User-Agent": "DrivipApp/2.0 (drivipapp@gmail.com)" },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          for (const item of data) {
            results.push({
              lat: parseFloat(item.lat), lng: parseFloat(item.lon),
              displayName: item.display_name,
            });
          }
          if (results.length > 0) break;
        }
      } catch { continue; }
    }
    return results;
  }, []);

  const searchPhoton = useCallback(async (q: string): Promise<GeocodingResult[]> => {
    const results: GeocodingResult[] = [];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.features) {
          for (const f of data.features) {
            const [lng, lat] = f.geometry.coordinates;
            const p = f.properties;
            const parts: string[] = [];
            if (p.name) parts.push(p.name);
            if (p.housenumber && p.street) parts.push(`${p.street} ${p.housenumber}`);
            else if (p.street) parts.push(p.street);
            if (p.district) parts.push(p.district);
            if (p.city || p.town || p.village) parts.push(p.city || p.town || p.village);
            if (p.state) parts.push(p.state);
            const label = parts.join(", ") || p.label || "";
            if (label) results.push({ lat, lng, displayName: label });
          }
        }
      }
    } catch { /* timeout */ }
    return results;
  }, []);

  const searchAddress = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); setSearchError(""); return; }
    setSearching(true); setSearchError("");
    const id = ++searchIdRef.current;
    const allResults: GeocodingResult[] = [];
    const seen = new Set<string>();

    const addAll = (items: GeocodingResult[]) => {
      for (const r of items) {
        const key = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`;
        if (!seen.has(key)) { seen.add(key); allResults.push(r); }
      }
    };

    // Photon first (browser-side, different IP)
    addAll(await searchPhoton(q));
    // Nominatim fallback (multiple instances)
    if (allResults.length < 3) {
      addAll(await searchNominatim(q));
    }

    if (id !== searchIdRef.current) return;

    if (allResults.length === 0) {
      setSearchError("No se encontraron resultados. Puedes arrastrar el mapa para colocar el punto manualmente.");
    }
    setResults(allResults.slice(0, 8));
    setSearching(false);
  }, [searchPhoton, searchNominatim]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchAddress]);

  const selectResult = (r: GeocodingResult) => {
    setCenter([r.lat, r.lng]);
    setSelectedAddress(r.displayName);
    setSelectedCoords({ lat: r.lat, lng: r.lng });
    setQuery(r.displayName); setResults([]); setSearchError("");
    inputRef.current?.blur();
  };

  const handleMapCenterChange = useCallback(async (newCenter: [number, number]) => {
    setSelectedCoords({ lat: newCenter[0], lng: newCenter[1] });

    // Reverse geocode - Photon
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://photon.komoot.io/api/?lon=${newCenter[1]}&lat=${newCenter[0]}&limit=1`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const p = data.features[0].properties;
          const parts: string[] = [];
          if (p.name) parts.push(p.name);
          if (p.street) parts.push(p.street);
          if (p.district) parts.push(p.district);
          if (p.city || p.town) parts.push(p.city || p.town);
          if (p.state) parts.push(p.state);
          const label = parts.join(", ") || p.label || "";
          if (label) { setSelectedAddress(label); setQuery(label); return; }
        }
      }
    } catch { /* fallback */ }

    // Reverse geocode - Nominatim
    for (const base of NOMINATIM_INSTANCES) {
      try {
        const params = new URLSearchParams({
          lat: String(newCenter[0]), lon: String(newCenter[1]),
          format: "jsonv2", "accept-language": "es", addressdetails: "1",
        });
        const res = await fetch(`${base}/reverse?${params}`, {
          headers: { "User-Agent": "DrivipApp/2.0 (drivipapp@gmail.com)" },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.display_name) {
            setSelectedAddress(data.display_name);
            setQuery(data.display_name.split(",").slice(0, 3).join(",").trim());
            return;
          }
        }
      } catch { continue; }
    }
  }, []);

  useEffect(() => {
    if (initialPointType !== "destination" || !initialOrigin || !selectedCoords) {
      setRouteGeometry(null); setTotalKm(0); setTotalMin(0); return;
    }
    let cancelled = false;
    setCalculating(true);
    const allPts = [
      { lat: initialOrigin.lat, lng: initialOrigin.lng },
      ...extraStops,
      { lat: selectedCoords.lat, lng: selectedCoords.lng },
    ];
    osrmRoute(allPts).then((result) => {
      if (cancelled) return;
      if (result) { setRouteGeometry(result.geometry); setTotalKm(result.distanceKm); setTotalMin(result.durationMin); }
      setCalculating(false);
    });
    return () => { cancelled = true; };
  }, [selectedCoords, extraStops, initialOrigin, initialPointType]);

  const addExtraStop = () => {
    if (!selectedCoords) return;
    setExtraStops([...extraStops, { lat: selectedCoords.lat, lng: selectedCoords.lng, address: selectedAddress || query }]);
    setSelectedAddress(""); setSelectedCoords(null); setQuery(""); setResults([]); setSearchError("");
  };

  const removeExtraStop = (index: number) => { setExtraStops(extraStops.filter((_, i) => i !== index)); };

  const handleConfirm = () => {
    const coords = selectedCoords || { lat: center[0], lng: center[1] };
    const addr = selectedAddress || query || "Punto en mapa";
    if (initialPointType === "destination" && initialOrigin) {
      if (onConfirmRoute) {
        onConfirmRoute(
          { lat: initialOrigin.lat, lng: initialOrigin.lng, address: initialOrigin.address },
          extraStops,
          { lat: coords.lat, lng: coords.lng, address: addr },
          totalKm, totalMin
        );
      } else { onConfirmPin(addr, "destination"); }
    } else { onConfirmPin(addr, "origin"); }
    onClose();
  };

  const handleGps = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newC: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCenter(newC);
          setSelectedCoords({ lat: newC[0], lng: newC[1] });
          onUseGps();
        },
        () => onUseGps(),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else { onUseGps(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100" data-purpose="map-picker-modal">
      {/* Top bar */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-3 pb-2 bg-white/90 backdrop-blur-lg border-b border-slate-200/60">
        <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shrink-0" onClick={onClose}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            {initialPointType === "origin" ? "Punto de Partida" : "¿A dónde vas?"}
          </h3>
          <p className="text-[11px] text-slate-400">
            {selectedCoords ? "Punto fijado en el mapa" : "Busca o arrastra el mapa"}
          </p>
        </div>
        {calculating && (
          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {selectedCoords && (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <MapLibreView
          center={center}
          zoom={selectedCoords ? 16 : 14}
          mapStyle={LIGHT_STYLE}
          className="w-full h-full"
          origin={initialPointType === "destination" && initialOrigin ? { lat: initialOrigin.lat, lng: initialOrigin.lng } : null}
          destination={selectedCoords ? { lat: selectedCoords.lat, lng: selectedCoords.lng } : null}
          route={routeGeometry || undefined}
          onCenterChange={handleMapCenterChange}
        />

        {/* Center pin */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-full flex justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center">
            <div className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xl shadow-slate-900/15 border max-w-[260px] truncate ${
              selectedCoords ? "bg-green-500 text-white border-green-600" : "bg-white text-slate-800 border-slate-200/60"
            }`}>
              {selectedAddress || (selectedCoords ? "Punto fijado" : "Arrastra el mapa aquí")}
            </div>
            <svg className={`w-7 h-7 drop-shadow-lg ${selectedCoords ? "text-green-500" : "text-purple-600"}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
          </div>
        </div>

        {/* Route info */}
        {selectedCoords && initialPointType === "destination" && initialOrigin && totalKm > 0 && (
          <div className="absolute top-3 left-3 right-3 z-10 px-3 py-2.5 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Distancia</span>
                <p className="text-sm font-black text-slate-900">{totalKm.toFixed(1)} km</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tiempo</span>
                <p className="text-sm font-black text-slate-900">
                  {totalMin < 60 ? `${Math.round(totalMin)} min` : `${Math.floor(totalMin / 60)}h ${Math.round(totalMin % 60)}m`}
                </p>
              </div>
              {extraStops.length > 0 && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Escalas</span>
                  <p className="text-sm font-black text-purple-600">{extraStops.length}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tip */}
        {!selectedCoords && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-slate-900/80 text-white text-[11px] font-medium backdrop-blur-sm flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Arrastra el mapa para colocar el pin donde necesites
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="relative z-20 bg-white border-t border-slate-200/60 px-4 pt-3 pb-8">
        {/* Extra stops */}
        {extraStops.length > 0 && (
          <div className="mb-2 space-y-1">
            {extraStops.map((stop, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs">
                <span className="w-5 h-5 rounded bg-purple-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="flex-1 truncate text-slate-700 font-medium">{stop.address}</span>
                <span className="text-[10px] text-slate-400 font-bold">ESCALA</span>
                <button className="text-red-400 active:scale-90" onClick={() => removeExtraStop(i)}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedAddress(""); setSelectedCoords(null); setSearchError(""); }}
            placeholder="Buscar dirección, barrio, avenida..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!searching && query.length > 0 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => { setQuery(""); setSelectedAddress(""); setSelectedCoords(null); setResults([]); setSearchError(""); }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-2 max-h-44 overflow-y-auto rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {results.map((r, i) => (
              <button key={i} className="w-full px-4 py-3 text-left flex items-start gap-3 active:bg-slate-50 transition-colors" onClick={() => selectResult(r)}>
                <svg className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="2" />
                </svg>
                <span className="text-xs text-slate-600 leading-tight line-clamp-2">{r.displayName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {searchError && !searching && (
          <div className="mb-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700">{searchError}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button className="py-3 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition shrink-0" onClick={handleGps}>
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            GPS
          </button>

          {selectedCoords && initialPointType === "destination" && (
            <button className="py-3 px-3 rounded-xl bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition shrink-0" onClick={addExtraStop}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              + Escala
            </button>
          )}

          <button
            className={`flex-1 py-3 rounded-xl text-sm font-bold shadow-lg active:scale-[0.97] transition flex items-center justify-center gap-2 ${
              selectedCoords
                ? "bg-green-600 text-white shadow-green-600/25"
                : "bg-purple-600 text-white shadow-purple-600/25"
            }`}
            onClick={handleConfirm}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {selectedCoords
              ? initialPointType === "destination"
                ? `Confirmar${totalKm > 0 ? ` (${totalKm.toFixed(1)} km)` : ""}`
                : "Confirmar Origen"
              : "Fijar Punto Aquí"}
          </button>
        </div>
      </div>
    </div>
  );
}
