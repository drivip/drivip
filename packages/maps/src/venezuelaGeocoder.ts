import { haversineKm } from "./navigationService";
import {
  expandVenezuelanAddress,
  findVenezuelaCity,
  isInVenezuela,
  normalizeText,
  VENEZUELA_LAT_MAX,
  VENEZUELA_LAT_MIN,
  VENEZUELA_LNG_MAX,
  VENEZUELA_LNG_MIN,
} from "./venezuela";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const PHOTON_URL = "https://photon.komoot.io";
const OSRM_URL = "https://router.project-osrm.org";

export type PlaceSource = "photon" | "nominatim" | "city" | "coords";

export interface VenezuelanPlace {
  lat: number;
  lng: number;
  displayName: string;
  primary: string;
  secondary: string;
  category?: string;
  source: PlaceSource;
  state?: string;
  city?: string;
  importance?: number;
}

interface SearchOptions {
  /** Punto de referencia para priorizar resultados cercanos. */
  near?: { lat: number; lng: number } | null;
  limit?: number;
  signal?: AbortSignal;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
}

interface NominatimItem {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  importance?: number;
  class?: string;
  type?: string;
  address?: Record<string, string>;
}

const searchCache = new Map<string, VenezuelanPlace[]>();
const inFlight = new Map<string, Promise<VenezuelanPlace[]>>();

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueParts(parts: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const part = (raw ?? "").trim();
    if (!part) continue;
    const key = normalizeText(part);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}

function joinLabel(primary: string, parts: (string | undefined | null)[]): string {
  return uniqueParts([primary, ...parts]).join(", ");
}

function parseCoordinates(query: string): VenezuelanPlace | null {
  const match = query.trim().match(/^(-?\d{1,3}(?:[.,]\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1].replace(",", "."));
  const lng = Number(match[2].replace(",", "."));
  if (!isInVenezuela(lat, lng)) return null;
  return {
    lat,
    lng,
    displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    primary: "Coordenadas",
    secondary: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    category: "coordenadas",
    source: "coords",
  };
}

function photonToPlace(feature: PhotonFeature): VenezuelanPlace | null {
  const coords = feature.geometry?.coordinates;
  if (!coords) return null;
  const [lng, lat] = coords;
  if (!isInVenezuela(lat, lng)) return null;

  const p = feature.properties ?? {};
  const countryCode = text(p.countrycode).toUpperCase();
  if (countryCode && countryCode !== "VE") return null;

  const name = text(p.name);
  const street = text(p.street);
  const houseNumber = text(p.housenumber);
  const district = text(p.district);
  const city = text(p.city) || text(p.town) || text(p.village) || text(p.county);
  const state = text(p.state);
  const streetLine = [street, houseNumber].filter(Boolean).join(" ");

  const primary = name || streetLine || district || city || state || "Lugar";
  const secondary = joinLabel("", [
    name && streetLine ? streetLine : "",
    district,
    city,
    state,
  ]);

  return {
    lat,
    lng,
    displayName: joinLabel(primary, [secondary]),
    primary,
    secondary,
    category: text(p.osm_value) || text(p.osm_key) || text(p.type) || undefined,
    source: "photon",
    state: state || undefined,
    city: city || undefined,
  };
}

function nominatimToPlace(item: NominatimItem): VenezuelanPlace | null {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!isInVenezuela(lat, lng)) return null;

  const a = item.address ?? {};
  const countryCode = text(a.country_code).toUpperCase();
  if (countryCode && countryCode !== "VE") return null;

  const road = text(a.road) || text(a.pedestrian) || text(a.footway);
  const houseNumber = text(a.house_number);
  const neighbourhood = text(a.neighbourhood) || text(a.suburb);
  const city = text(a.city) || text(a.town) || text(a.village) || text(a.municipality);
  const state = text(a.state);
  const name = text(item.name);
  const streetLine = [road, houseNumber].filter(Boolean).join(" ");

  const primary = name || streetLine || neighbourhood || city || state || "Lugar";
  const secondary = joinLabel("", [
    name && streetLine ? streetLine : "",
    neighbourhood,
    city,
    state,
  ]);

  return {
    lat,
    lng,
    displayName: joinLabel(primary, [secondary]),
    primary,
    secondary,
    category: text(item.class) || text(item.type) || undefined,
    source: "nominatim",
    state: state || undefined,
    city: city || undefined,
    importance: item.importance,
  };
}

function scorePlace(place: VenezuelanPlace, query: string, near?: { lat: number; lng: number } | null): number {
  const q = normalizeText(query);
  const primary = normalizeText(place.primary);
  const full = normalizeText(place.displayName);

  let score = 0;
  if (place.source === "city") score += 500;
  if (primary === q) score += 160;
  else if (primary.startsWith(q)) score += 120;
  else if (primary.includes(q)) score += 90;
  else if (full.includes(q)) score += 55;

  const tokens = q.split(" ").filter((token) => token.length > 2);
  for (const token of tokens) {
    if (primary.includes(token)) score += 18;
    else if (full.includes(token)) score += 9;
  }

  if (place.category && !["coordinates", "coordenadas", "city", "ciudad"].includes(place.category)) {
    score += 12;
  }

  if (near) {
    const distance = haversineKm([near.lat, near.lng], [place.lat, place.lng]);
    if (distance < 60) score += Math.max(0, 70 - distance * 2);
    if (distance > 250) score -= 30;
  }

  return score;
}

function dedupe(places: VenezuelanPlace[]): VenezuelanPlace[] {
  const seen = new Set<string>();
  const out: VenezuelanPlace[] = [];
  for (const place of places) {
    const key = `${place.lat.toFixed(4)},${place.lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

async function searchPhoton(query: string, opts: SearchOptions): Promise<VenezuelanPlace[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(Math.max(8, opts.limit ?? 12)),
    lang: "es",
  });

  if (opts.near) {
    params.set("lat", String(opts.near.lat));
    params.set("lon", String(opts.near.lng));
    const pad = 1.2;
    params.set(
      "bbox",
      [
        Math.max(VENEZUELA_LNG_MIN, opts.near.lng - pad),
        Math.max(VENEZUELA_LAT_MIN, opts.near.lat - pad),
        Math.min(VENEZUELA_LNG_MAX, opts.near.lng + pad),
        Math.min(VENEZUELA_LAT_MAX, opts.near.lat + pad),
      ].join(",")
    );
  }

  try {
    const res = await fetch(`${PHOTON_URL}/api/?${params}`, {
      signal: opts.signal ?? AbortSignal.timeout(7000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const features: PhotonFeature[] = Array.isArray(data?.features) ? data.features : [];
    return features
      .map(photonToPlace)
      .filter((place): place is VenezuelanPlace => Boolean(place));
  } catch {
    return [];
  }
}

async function searchNominatim(query: string, opts: SearchOptions): Promise<VenezuelanPlace[]> {
  const near = opts.near ?? { lat: 7.1, lng: -66.5 };
  const padLng = opts.near ? 1.2 : (VENEZUELA_LNG_MAX - VENEZUELA_LNG_MIN) / 2;
  const padLat = opts.near ? 1.2 : (VENEZUELA_LAT_MAX - VENEZUELA_LAT_MIN) / 2;

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: String(Math.max(6, opts.limit ?? 10)),
    addressdetails: "1",
    dedupe: "1",
    countrycodes: "ve",
    "accept-language": "es",
    viewbox: [
      Math.max(VENEZUELA_LNG_MIN, near.lng - padLng),
      Math.min(VENEZUELA_LAT_MAX, near.lat + padLat),
      Math.min(VENEZUELA_LNG_MAX, near.lng + padLng),
      Math.max(VENEZUELA_LAT_MIN, near.lat - padLat),
    ].join(","),
    bounded: "0",
  });

  try {
    const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
      signal: opts.signal ?? AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items: NominatimItem[] = Array.isArray(data) ? data : [];
    return items
      .map(nominatimToPlace)
      .filter((place): place is VenezuelanPlace => Boolean(place));
  } catch {
    return [];
  }
}

/**
 * Busca direcciones, calles, puntos de referencia y ciudades solamente dentro
 * de Venezuela. Prioriza resultados cercanos al cliente cuando se pasa `near`.
 */
export async function searchVenezuelaPlaces(
  rawQuery: string,
  opts: SearchOptions = {}
): Promise<VenezuelanPlace[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const nearKey = opts.near ? `${opts.near.lat.toFixed(2)},${opts.near.lng.toFixed(2)}` : "ve";
  const cacheKey = `${normalizeText(query)}|${nearKey}|${opts.limit ?? 8}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const running = inFlight.get(cacheKey);
  if (running) return running;

  const task = (async () => {
    const collected: VenezuelanPlace[] = [];

    const coords = parseCoordinates(query);
    if (coords) {
      searchCache.set(cacheKey, [coords]);
      return [coords];
    }

    const city = findVenezuelaCity(query);
    if (city) {
      collected.push({
        lat: city.lat,
        lng: city.lng,
        displayName: `${city.nombre}, ${city.estado}`,
        primary: city.nombre,
        secondary: city.estado,
        category: "ciudad",
        source: "city",
        city: city.nombre,
        state: city.estado,
      });
    }

    const expanded = expandVenezuelanAddress(query) || query;
    const [photon, nominatim] = await Promise.all([
      searchPhoton(expanded, opts),
      searchNominatim(expanded, opts),
    ]);

    collected.push(...photon, ...nominatim);

    const limit = opts.limit ?? 8;
    const places = dedupe(collected)
      .map((place) => ({ place, score: scorePlace(place, query, opts.near) }))
      .sort((a, b) => b.score - a.score || (b.place.importance ?? 0) - (a.place.importance ?? 0))
      .slice(0, limit)
      .map((entry) => entry.place);

    if (places.length > 0) {
      searchCache.set(cacheKey, places);
      if (searchCache.size > 120) {
        const oldest = searchCache.keys().next().value;
        if (oldest) searchCache.delete(oldest);
      }
    }
    return places;
  })().finally(() => {
    inFlight.delete(cacheKey);
  });

  inFlight.set(cacheKey, task);
  return task;
}

/** Geocodificación inversa limitada a Venezuela. */
export async function reverseVenezuelaPlace(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<VenezuelanPlace | null> {
  if (!isInVenezuela(lat, lng)) return null;

  try {
    const params = new URLSearchParams({
      lon: String(lng),
      lat: String(lat),
      lang: "es",
    });
    const res = await fetch(`${PHOTON_URL}/reverse?${params}`, {
      signal: signal ?? AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const feature: PhotonFeature | undefined = data?.features?.[0];
      if (feature) {
        const place = photonToPlace(feature);
        if (place) return place;
      }
    }
  } catch {
    // Continúa con Nominatim.
  }

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "jsonv2",
      addressdetails: "1",
      zoom: "18",
      "accept-language": "es",
    });
    const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
      signal: signal ?? AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimItem;
    return nominatimToPlace(data);
  } catch {
    return null;
  }
}

export interface DrivingRoute {
  geometry: [number, number][];
  distanceKm: number;
  durationMin: number;
}

/** Calcula la ruta de manejo entre dos o más puntos con OSRM. */
export async function fetchDrivingRoute(
  waypoints: { lat: number; lng: number }[]
): Promise<DrivingRoute | null> {
  if (waypoints.length < 2) return null;
  const coords = waypoints.map((point) => `${point.lng},${point.lat}`).join(";");

  try {
    const res = await fetch(
      `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data?.routes) || data.routes.length === 0) return null;
    const route = data.routes[0];
    return {
      geometry: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
      distanceKm: Number(route.distance) / 1000,
      durationMin: Number(route.duration) / 60,
    };
  } catch {
    return null;
  }
}
