import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollLock } from "../../hooks/useScrollLock";
import {
  MapLibreView,
  fetchDrivingRoute,
  isInVenezuela,
  reverseVenezuelaPlace,
  searchVenezuelaPlaces,
  VENEZUELA_CENTER,
  VENEZUELA_MAP_BOUNDS,
  type VenezuelanPlace,
} from "@drivip/maps";

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const RECENT_KEY = "drivip:recientes";
const RECENT_LIMIT = 6;

export interface MapPickerSuggestion {
  id: string;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  icon?: string;
}

export interface MapPickerPlace {
  address: string;
  lat: number;
  lng: number;
}

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseGps?: (coords: { lat: number; lng: number }) => void;
  onConfirmPin: (place: MapPickerPlace, point: "origin" | "destination" | "stop") => void;
  onConfirmRoute?: (
    origin: MapPickerPlace,
    stops: MapPickerPlace[],
    destination: MapPickerPlace,
    totalKm: number,
    totalMin: number
  ) => void;
  initialOrigin?: { lat: number; lng: number; address: string } | null;
  initialStops?: MapPickerPlace[];
  pointType?: "origin" | "destination" | "stop";
  suggestions?: MapPickerSuggestion[];
}

interface RecentPlace {
  primary: string;
  address: string;
  lat: number;
  lng: number;
}

function readRecent(): RecentPlace[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentPlace =>
        Boolean(item) &&
        typeof item.lat === "number" &&
        typeof item.lng === "number" &&
        isInVenezuela(item.lat, item.lng)
      )
      .slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function writeRecent(place: RecentPlace) {
  try {
    const next = [place, ...readRecent().filter(
      (item) => Math.abs(item.lat - place.lat) > 0.0001 || Math.abs(item.lng - place.lng) > 0.0001
    )].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // El almacenamiento local puede estar deshabilitado; no es crítico.
  }
}

function categoryIcon(category?: string): string {
  const value = (category ?? "").toLowerCase();
  if (value.includes("airport") || value.includes("aeropuerto")) return "flight";
  if (value.includes("hospital") || value.includes("clinic") || value.includes("doctor")) return "local_hospital";
  if (value.includes("school") || value.includes("university") || value.includes("college")) return "school";
  if (value.includes("mall") || value.includes("shop") || value.includes("supermarket") || value.includes("market")) return "storefront";
  if (value.includes("restaurant") || value.includes("cafe") || value.includes("food")) return "restaurant";
  if (value.includes("hotel") || value.includes("tourism")) return "hotel";
  if (value.includes("fuel") || value.includes("gas")) return "local_gas_station";
  if (value.includes("bank") || value.includes("atm")) return "account_balance";
  if (value.includes("park")) return "park";
  if (value.includes("metro") || value.includes("station") || value.includes("bus")) return "directions_transit";
  if (value.includes("ciudad")) return "location_city";
  return "location_on";
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  return `${Math.floor(min / 60)} h ${Math.round(min % 60)} min`;
}

export default function MapPickerModal({
  isOpen,
  onClose,
  onUseGps,
  onConfirmPin,
  onConfirmRoute,
  initialOrigin,
  initialStops = [],
  pointType: initialPointType = "origin",
  suggestions = [],
}: MapPickerModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VenezuelanPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recent, setRecent] = useState<RecentPlace[]>([]);

  const [mapCenter, setMapCenter] = useState<[number, number]>(VENEZUELA_CENTER);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: VENEZUELA_CENTER[0],
    lng: VENEZUELA_CENTER[1],
  });
  const [address, setAddress] = useState("");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [outsideVenezuela, setOutsideVenezuela] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [extraStops, setExtraStops] = useState<MapPickerPlace[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [totalKm, setTotalKm] = useState(0);
  const [totalMin, setTotalMin] = useState(0);
  const [calculating, setCalculating] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const searchIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const coordsRef = useRef({ lat: VENEZUELA_CENTER[0], lng: VENEZUELA_CENTER[1] });

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useScrollLock(isOpen);

  const resetState = useCallback(() => {
    const hasOrigin = Boolean(
      initialOrigin && isInVenezuela(initialOrigin.lat, initialOrigin.lng)
    );
    const startLat = hasOrigin ? initialOrigin!.lat : VENEZUELA_CENTER[0];
    const startLng = hasOrigin ? initialOrigin!.lng : VENEZUELA_CENTER[1];
    const showOriginAddress = initialPointType === "origin" && hasOrigin;

    setQuery("");
    setResults([]);
    setSearchError("");
    setSearching(false);
    setSearchFocused(false);
    setRecent(readRecent());
    setMapCenter([startLat, startLng]);
    setCoords({ lat: startLat, lng: startLng });
    coordsRef.current = { lat: startLat, lng: startLng };
    setAddress(showOriginAddress ? initialOrigin!.address : "");
    setPrimary(showOriginAddress ? initialOrigin!.address : "");
    setSecondary("");
    setAddressLoading(false);
    setOutsideVenezuela(!isInVenezuela(startLat, startLng));
    setGpsLoading(false);
    setExtraStops(initialStops);
    setRouteGeometry(null);
    setTotalKm(0);
    setTotalMin(0);
    setCalculating(false);
  }, [initialOrigin, initialPointType, initialStops]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) resetState();
    wasOpenRef.current = isOpen;
  }, [isOpen, resetState]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      reverseAbortRef.current?.abort();
    };
  }, []);

  /* ---------------------------------------------------------------- Búsqueda */

  const runSearch = useCallback(
    async (value: string) => {
      if (value.trim().length < 2) {
        setResults([]);
        setSearchError("");
        setSearching(false);
        return;
      }

      const id = ++searchIdRef.current;
      setSearching(true);
      setSearchError("");

      const places = await searchVenezuelaPlaces(value, {
        near: coordsRef.current,
        limit: 8,
      });

      if (id !== searchIdRef.current) return;

      setResults(places);
      setSearching(false);
      if (places.length === 0) {
        setSearchError("No encontramos ese lugar en Venezuela. Prueba con una calle, avenida o punto de referencia.");
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, runSearch]);

  /* ------------------------------------------------------ Geocodificación inversa */

  const reverseAt = useCallback((lat: number, lng: number) => {
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    reverseAbortRef.current?.abort();

    const inside = isInVenezuela(lat, lng);
    setOutsideVenezuela(!inside);
    setCoords({ lat, lng });

    if (!inside) {
      setAddress("");
      setPrimary("Fuera de Venezuela");
      setSecondary("Drivip solo opera dentro del territorio venezolano");
      setAddressLoading(false);
      return;
    }

    setAddressLoading(true);

    reverseTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      reverseAbortRef.current = controller;
      const place = await reverseVenezuelaPlace(lat, lng, controller.signal);
      if (controller.signal.aborted) return;

      if (place) {
        setAddress(place.displayName);
        setPrimary(place.primary);
        setSecondary(place.secondary);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setPrimary("Punto en el mapa");
        setSecondary("Arrastra el mapa para ajustar la ubicación");
      }
      setAddressLoading(false);
    }, 550);
  }, []);

  const handleCenterChange = useCallback(
    (next: [number, number]) => {
      setSearchFocused(false);
      reverseAt(next[0], next[1]);
    },
    [reverseAt]
  );

  /* ------------------------------------------------------------------- Acciones */

  const moveTo = useCallback((lat: number, lng: number, nextAddress?: string) => {
    setMapCenter([lat, lng]);
    setCoords({ lat, lng });
    setOutsideVenezuela(!isInVenezuela(lat, lng));
    if (nextAddress) setAddress(nextAddress);
  }, []);

  const selectPlace = useCallback((place: VenezuelanPlace) => {
    const next: RecentPlace = {
      primary: place.primary,
      address: place.displayName,
      lat: place.lat,
      lng: place.lng,
    };
    writeRecent(next);
    setRecent(readRecent());
    moveTo(place.lat, place.lng);
    setPrimary(place.primary);
    setSecondary(place.secondary);
    setAddress(place.displayName);
    setQuery(place.primary);
    setResults([]);
    setSearchError("");
    setSearchFocused(false);
    setAddressLoading(false);
    inputRef.current?.blur();
  }, [moveTo]);

  const selectSuggestion = useCallback(async (suggestion: MapPickerSuggestion) => {
    if (typeof suggestion.lat === "number" && typeof suggestion.lng === "number" && isInVenezuela(suggestion.lat, suggestion.lng)) {
      selectPlace({
        lat: suggestion.lat,
        lng: suggestion.lng,
        displayName: suggestion.address,
        primary: suggestion.name,
        secondary: suggestion.address,
        source: "city",
        category: "guardada",
      });
      return;
    }

    setQuery(suggestion.address || suggestion.name);
    inputRef.current?.focus();
    const places = await searchVenezuelaPlaces(suggestion.address || suggestion.name, {
      near: coordsRef.current,
      limit: 1,
    });
    if (places[0]) selectPlace(places[0]);
  }, [selectPlace]);

  const selectRecent = useCallback((item: RecentPlace) => {
    selectPlace({
      lat: item.lat,
      lng: item.lng,
      displayName: item.address,
      primary: item.primary,
      secondary: "",
      source: "city",
      category: "reciente",
    });
  }, [selectPlace]);

  const useGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setSearchError("Tu dispositivo no permite obtener la ubicación GPS.");
      return;
    }
    setGpsLoading(true);
    setSearchError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (!isInVenezuela(lat, lng)) {
          setOutsideVenezuela(true);
          setSearchError("Tu GPS está fuera de Venezuela. Elige tu ubicación manualmente en el mapa.");
          setMapCenter(VENEZUELA_CENTER);
          setCoords({ lat: VENEZUELA_CENTER[0], lng: VENEZUELA_CENTER[1] });
          return;
        }

        moveTo(lat, lng);
        reverseAt(lat, lng);
        onUseGps?.({ lat, lng });
      },
      () => {
        setGpsLoading(false);
        setSearchError("No pudimos obtener tu GPS. Revisa los permisos o busca tu dirección.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 20000 }
    );
  }, [moveTo, onUseGps, reverseAt]);

  /* ------------------------------------------------------------------- Ruta */

  const calculateRoute = useCallback(async () => {
    if (initialPointType !== "destination" || !initialOrigin) return null;

    const waypoints = [
      { lat: initialOrigin.lat, lng: initialOrigin.lng },
      ...extraStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
      { lat: coords.lat, lng: coords.lng },
    ];

    if (waypoints.some((point) => !isInVenezuela(point.lat, point.lng))) {
      setRouteGeometry(null);
      setTotalKm(0);
      setTotalMin(0);
      return null;
    }

    setCalculating(true);
    const route = await fetchDrivingRoute(waypoints);
    setCalculating(false);

    if (!route) {
      setRouteGeometry(null);
      setTotalKm(0);
      setTotalMin(0);
      return null;
    }

    setRouteGeometry(route.geometry);
    setTotalKm(route.distanceKm);
    setTotalMin(route.durationMin);
    return route;
  }, [coords.lat, coords.lng, extraStops, initialOrigin, initialPointType]);

  useEffect(() => {
    if (!isOpen || initialPointType !== "destination" || !initialOrigin) {
      setRouteGeometry(null);
      setTotalKm(0);
      setTotalMin(0);
      return;
    }

    const timer = setTimeout(() => void calculateRoute(), 450);
    return () => clearTimeout(timer);
  }, [calculateRoute, initialOrigin, initialPointType, isOpen]);

  const addExtraStop = useCallback(() => {
    if (outsideVenezuela) return;
    const stop: MapPickerPlace = {
      address: address || primary || "Punto en el mapa",
      lat: coords.lat,
      lng: coords.lng,
    };
    setExtraStops((prev) => [...prev, stop]);
    setPrimary("");
    setSecondary("");
    setAddress("");
    setQuery("");
    setResults([]);
  }, [address, coords.lat, coords.lng, outsideVenezuela, primary]);

  const handleConfirm = useCallback(async () => {
    if (outsideVenezuela) {
      setSearchError("Selecciona una ubicación dentro de Venezuela para continuar.");
      return;
    }

    const finalAddress = address || primary || "Punto en el mapa";
    const place: MapPickerPlace = { address: finalAddress, lat: coords.lat, lng: coords.lng };

    writeRecent({
      primary: primary || finalAddress,
      address: finalAddress,
      lat: coords.lat,
      lng: coords.lng,
    });

    if (initialPointType === "destination" && initialOrigin && onConfirmRoute) {
      let km = totalKm;
      let min = totalMin;

      if (km <= 0) {
        const route = await calculateRoute();
        if (route) {
          km = route.distanceKm;
          min = route.durationMin;
        }
      }

      onConfirmRoute(
        { address: initialOrigin.address, lat: initialOrigin.lat, lng: initialOrigin.lng },
        extraStops,
        place,
        km,
        min
      );
    } else {
      onConfirmPin(place, initialPointType);
    }

    onClose();
  }, [
    address,
    calculateRoute,
    coords.lat,
    coords.lng,
    extraStops,
    initialOrigin,
    initialPointType,
    onClose,
    onConfirmPin,
    onConfirmRoute,
    outsideVenezuela,
    primary,
    totalKm,
    totalMin,
  ]);

  if (!isOpen) return null;

  const pinLabel = addressLoading
    ? "Obteniendo dirección..."
    : primary || address || (outsideVenezuela ? "Fuera de Venezuela" : initialPointType === "stop" ? "Mueve el mapa hasta la escala" : "Mueve el mapa");

  const showSearchPanel = searchFocused || query.trim().length > 0;
  const savedSuggestions = suggestions.filter(
    (item) => typeof item.lat === "number" && typeof item.lng === "number"
  );

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden bg-slate-950" data-purpose="map-picker-modal">
      {/* Mapa a pantalla completa */}
      <div className="absolute inset-0">
        <MapLibreView
          center={mapCenter}
          zoom={16}
          mapStyle={LIGHT_STYLE}
          className="h-full w-full"
          maxBounds={VENEZUELA_MAP_BOUNDS}
          origin={
            initialPointType === "destination" && initialOrigin
              ? { lat: initialOrigin.lat, lng: initialOrigin.lng }
              : null
          }
          destination={initialPointType === "destination" ? { lat: coords.lat, lng: coords.lng } : null}
          route={routeGeometry || undefined}
          onCenterChange={handleCenterChange}
        />
      </div>

      {/* Buscador flotante */}
      <div className="absolute inset-x-0 top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Volver"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative min-w-0 flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7.5" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              enterKeyHint="search"
              autoComplete="off"
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                setSearchError("");
                setSearchFocused(true);
                if (value.trim().length === 0) setResults([]);
              }}
              onFocus={() => setSearchFocused(true)}
              placeholder="Calle, barrio o punto de referencia"
              aria-label="Buscar dirección en Venezuela"
              className="h-12 w-full rounded-2xl border border-white/60 bg-white/95 pl-11 pr-11 text-base font-semibold text-slate-800 placeholder-slate-400 shadow-lg outline-none backdrop-blur-md focus:ring-2 focus:ring-purple-500/40 sm:text-sm"
            />
            {searching ? (
              <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            ) : query.length > 0 ? (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearchError("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Usar mi ubicación GPS"
            onClick={useGps}
            disabled={gpsLoading}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/95 text-emerald-600 shadow-lg backdrop-blur-md active:scale-95 disabled:opacity-60"
          >
            {gpsLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Panel de búsqueda / sugerencias */}
        {showSearchPanel && (
          <div className="mt-2 max-h-[52dvh] overflow-y-auto overscroll-contain rounded-3xl border border-white/60 bg-white/97 shadow-2xl backdrop-blur-xl">
            {searchError ? (
              <div className="flex items-start gap-2.5 px-4 py-4">
                <span className="material-symbols-outlined mt-0.5 text-[19px] text-amber-500">info</span>
                <p className="text-xs font-medium leading-relaxed text-slate-600">{searchError}</p>
              </div>
            ) : null}

            {results.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {results.map((place, index) => (
                  <li key={`${place.lat}-${place.lng}-${index}`}>
                    <button
                      type="button"
                      onClick={() => selectPlace(place)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <span className="material-symbols-outlined text-[20px]">
                          {categoryIcon(place.category)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">{place.primary}</span>
                        <span className="block truncate text-xs font-medium text-slate-500">
                          {place.secondary || place.displayName}
                        </span>
                      </span>
                      {place.source === "city" ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          Ciudad
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : !searching && query.trim().length < 2 ? (
              <div className="p-3">
                {savedSuggestions.length > 0 && (
                  <>
                    <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Tus direcciones
                    </p>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {savedSuggestions.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void selectSuggestion(item)}
                          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px] text-purple-600">
                            {item.icon || "home"}
                          </span>
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {recent.length > 0 && (
                  <>
                    <p className="px-1 pb-1 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Recientes
                    </p>
                    <ul>
                      {recent.map((item, index) => (
                        <li key={`${item.lat}-${item.lng}-${index}`}>
                          <button
                            type="button"
                            onClick={() => selectRecent(item)}
                            className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left active:bg-slate-50"
                          >
                            <span className="material-symbols-outlined text-[19px] text-slate-400">history</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-bold text-slate-800">{item.primary}</span>
                              <span className="block truncate text-[11px] text-slate-400">{item.address}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="mt-2 flex items-start gap-2 rounded-2xl bg-slate-50 p-3">
                  <span className="material-symbols-outlined text-[18px] text-purple-500">tips_and_updates</span>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-500">
                    Busca por <strong className="text-slate-700">avenida, calle, sector, barrio</strong> o un
                    <strong className="text-slate-700"> punto de referencia</strong> (centro comercial, hospital,
                    plaza). También puedes arrastrar el mapa y fijar el pin.
                  </p>
                </div>
              </div>
            ) : !searching && query.trim().length >= 2 && results.length === 0 && !searchError ? (
              <div className="px-4 py-6 text-center">
                <span className="material-symbols-outlined text-[34px] text-slate-300">location_off</span>
                <p className="mt-1 text-xs font-semibold text-slate-500">Sin resultados dentro de Venezuela</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Pin central */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-full justify-center">
        <div className="flex flex-col items-center">
          <div
            className={`max-w-[280px] truncate rounded-xl border px-3 py-1.5 text-[11px] font-bold shadow-xl ${
              outsideVenezuela
                ? "border-red-200 bg-red-500 text-white"
                : addressLoading
                  ? "border-slate-200 bg-white text-slate-500"
                  : "border-white/60 bg-slate-900/90 text-white backdrop-blur-md"
            }`}
          >
            {pinLabel}
          </div>
          <div className="relative mt-0.5 flex h-10 w-10 items-center justify-center">
            <span
              className={`absolute bottom-0 h-5 w-5 rounded-full ${
                outsideVenezuela ? "bg-red-500/30" : "bg-purple-600/30"
              } animate-ping`}
            />
            <svg
              className={`relative h-9 w-9 drop-shadow-xl ${
                outsideVenezuela ? "text-red-500" : "text-purple-700"
              }`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
          </div>
          <div className="-mt-1 h-1.5 w-6 rounded-full bg-slate-900/20 blur-[1px]" />
        </div>
      </div>

      {/* Info de ruta flotante */}
      {initialPointType === "destination" && initialOrigin && (totalKm > 0 || calculating) && (
        <div className="pointer-events-none absolute left-3 right-3 top-[7.5rem] z-10 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-white/60 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-md">
            {calculating ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                <span className="text-[11px] font-bold text-slate-600">Calculando ruta...</span>
              </>
            ) : (
              <>
                <span className="text-xs font-black text-slate-900">{formatDistance(totalKm)}</span>
                <span className="h-3 w-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-600">{formatDuration(totalMin)}</span>
                {extraStops.length > 0 && (
                  <>
                    <span className="h-3 w-px bg-slate-200" />
                    <span className="text-[10px] font-bold text-purple-600">
                      {extraStops.length} escala{extraStops.length > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Hoja inferior */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 max-h-[72dvh] overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-white/70 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_rgba(15,23,42,0.18)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.14) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />

        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              initialPointType === "origin"
                ? "bg-emerald-50 text-emerald-600"
                : initialPointType === "stop"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-orange-50 text-orange-600"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {initialPointType === "origin" ? "my_location" : initialPointType === "stop" ? "add_location_alt" : "location_on"}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {initialPointType === "origin" ? "¿Dónde estás?" : initialPointType === "stop" ? "Escala del viaje" : "Destino"}
            </p>
            <p className="line-clamp-2 text-[15px] font-black leading-tight text-slate-900">
              {addressLoading ? "Ubicando dirección..." : primary || (outsideVenezuela ? "Fuera de Venezuela" : "Selecciona un punto")}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-slate-500">
              {outsideVenezuela
                ? "Drivip solo está disponible en Venezuela. Mueve el mapa o usa tu GPS."
                : secondary ||
                  (addressLoading
                    ? "Espera un momento"
                    : initialPointType === "stop"
                      ? "Ubica la parada intermedia y confirma."
                      : "Arrastra el mapa para ajustar el pin")}
            </p>
          </div>
          {addressLoading && (
            <span className="mt-1 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          )}
        </div>

        {extraStops.length > 0 && (
          <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
            {extraStops.map((stop, index) => (
              <div
                key={`${stop.lat}-${stop.lng}-${index}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 py-1.5 pl-2 pr-1.5 text-[11px] font-bold text-purple-700"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">
                  {index + 1}
                </span>
                <span className="max-w-[150px] truncate">{stop.address}</span>
                <button
                  type="button"
                  aria-label={`Quitar escala ${index + 1}`}
                  onClick={() => setExtraStops((prev) => prev.filter((_, i) => i !== index))}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-purple-500 active:scale-90"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {initialPointType === "destination" && (
            <button
              type="button"
              onClick={addExtraStop}
              disabled={outsideVenezuela}
              className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 active:scale-95 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Escala
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={outsideVenezuela || addressLoading || calculating}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-sm font-black text-white shadow-lg shadow-purple-600/25 active:scale-[0.98] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[19px]">
              {initialPointType === "stop" ? "add_location_alt" : "check_circle"}
            </span>
            {initialPointType === "origin"
              ? "Confirmar origen"
              : initialPointType === "stop"
                ? "Agregar escala"
                : "Confirmar destino"}
          </button>
        </div>
      </div>
    </div>
  );
}
