import { useState, useEffect, useRef } from "react";
import { useGeocoding } from "@drivip/maps";
import { useScrollLock } from "../../hooks/useScrollLock";
import { MapLibreView } from "@drivip/maps";

const VOYAGER_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const CARACAS_CENTER: [number, number] = [10.4806, -66.9036];

interface DestinationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (dest: { address: string; lat: number; lng: number }) => void;
  onSelectOrigin?: (origin: { address: string; lat: number; lng: number }) => void;
}

const QUICK_ADDRESSES = [
  { name: "Casa", icon: "home", color: "blue" },
  { name: "Trabajo", icon: "business", color: "purple" },
];

export default function DestinationPicker({
  isOpen,
  onClose,
  onSelectDestination,
  onSelectOrigin,
}: DestinationPickerProps) {
  const [query, setQuery] = useState("");
  const [pointType, setPointType] = useState<"origin" | "destination">("destination");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const { results, loading, search } = useGeocoding();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.length >= 3) search(query);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const selectResult = (r: { lat: number; lng: number; displayName: string }) => {
    setSelectedCoords([r.lat, r.lng]);
    setSelectedAddress(r.displayName);
    setQuery(r.displayName);
    inputRef.current?.blur();
  };

  const handleConfirm = () => {
    if (!selectedCoords) return;
    const data = { address: selectedAddress || query, lat: selectedCoords[0], lng: selectedCoords[1] };
    if (pointType === "origin" && onSelectOrigin) {
      onSelectOrigin(data);
    } else {
      onSelectDestination(data);
    }
    onClose();
    setQuery("");
    setSelectedCoords(null);
    setSelectedAddress("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100" data-purpose="destination-picker">
      {/* Top bar */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-3 pb-2 bg-white/90 backdrop-blur-lg border-b border-slate-200/60">
        <button
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shrink-0"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            {pointType === "origin" ? "Punto de partida" : "¿A dónde vas?"}
          </h3>
          <p className="text-[11px] text-slate-400">Busca o selecciona en el mapa</p>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <MapLibreView
          center={selectedCoords || CARACAS_CENTER}
          zoom={selectedCoords ? 16 : 13}
          mapStyle={VOYAGER_STYLE}
          origin={pointType === "origin" && selectedCoords ? { lat: selectedCoords[0], lng: selectedCoords[1] } : null}
          destination={pointType === "destination" && selectedCoords ? { lat: selectedCoords[0], lng: selectedCoords[1] } : null}
        />
        {/* Center pin */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-full flex justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center">
            <div className="px-3 py-1.5 rounded-lg bg-white text-slate-800 text-[11px] font-bold shadow-xl shadow-slate-900/15 border border-slate-200/60 max-w-[220px] truncate">
              {selectedAddress || "Mueve el mapa para seleccionar"}
            </div>
            <svg className={`w-6 h-6 drop-shadow-md ${pointType === "origin" ? "text-emerald-500" : "text-orange-500"}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div className="relative z-20 bg-white/90 backdrop-blur-lg border-t border-slate-200/60 px-5 pt-4 pb-8 safe-area-bottom">
        {/* Point type toggle */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-3">
          <button
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pointType === "origin" ? "bg-emerald-500 text-white shadow-md" : "text-slate-500"
            }`}
            onClick={() => setPointType("origin")}
          >
            Punto de Partida
          </button>
          <button
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pointType === "destination" ? "bg-orange-500 text-white shadow-md" : "text-slate-500"
            }`}
            onClick={() => setPointType("destination")}
          >
            Punto de Llegada
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedAddress(""); setSelectedCoords(null); }}
            placeholder={pointType === "origin" ? "Buscar punto de partida..." : "Buscar dirección..."}
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions */}
        {results.length > 0 && (
          <div className="mb-3 max-h-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {results.map((r, i) => (
              <button
                key={i}
                className="w-full px-4 py-3 text-left flex items-start gap-3 active:bg-slate-50 transition-colors"
                onClick={() => selectResult(r)}
              >
                <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="2" />
                </svg>
                <span className="text-xs text-slate-600 leading-tight line-clamp-2">{r.displayName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick addresses */}
        {query.length < 3 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Accesos rápidos</p>
            <div className="flex gap-2">
              {QUICK_ADDRESSES.map((qa) => (
                <button
                  key={qa.name}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 active:scale-95 transition"
                  onClick={() => setQuery(qa.name)}
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-500">{qa.icon}</span>
                  {qa.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                  setSelectedCoords(coords);
                  setSelectedAddress("Mi ubicación actual");
                });
              }
            }}
          >
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            GPS
          </button>
          <button
            className={`flex-[2] py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg active:scale-[0.97] transition-transform flex items-center justify-center gap-2 ${
              selectedCoords
                ? "bg-purple-600 shadow-purple-600/25"
                : "bg-slate-400 shadow-slate-400/25"
            }`}
            disabled={!selectedCoords}
            onClick={handleConfirm}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Confirmar {pointType === "origin" ? "Partida" : "Llegada"}
          </button>
        </div>
      </div>
    </div>
  );
}
