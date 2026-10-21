/**
 * Geografía base de Venezuela.
 *
 * Drivip opera únicamente en Venezuela. Estas constantes y utilidades se usan
 * para validar ubicaciones, centrar el mapa y sesgar las búsquedas de
 * direcciones hacia el país (nunca hacia México u otro país).
 */

export interface VenezuelaCity {
  nombre: string;
  estado: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export interface VenezuelaState {
  nombre: string;
  ciudades: string[];
}

/** Límites aproximados del territorio venezolano. */
export const VENEZUELA_LAT_MIN = 0.5;
export const VENEZUELA_LAT_MAX = 12.6;
export const VENEZUELA_LNG_MIN = -73.6;
export const VENEZUELA_LNG_MAX = -59.4;

/** Bounds en formato MapLibre: [[oeste, sur], [este, norte]]. */
export const VENEZUELA_MAP_BOUNDS: [[number, number], [number, number]] = [
  [VENEZUELA_LNG_MIN, VENEZUELA_LAT_MIN],
  [VENEZUELA_LNG_MAX, VENEZUELA_LAT_MAX],
];

/** Centro por defecto: Caracas. Solo se usa cuando no hay GPS válido. */
export const VENEZUELA_CENTER: [number, number] = [10.4806, -66.9036];

export const VENEZUELA_CITIES: VenezuelaCity[] = [
  { nombre: "Caracas", estado: "Distrito Capital", lat: 10.4806, lng: -66.9036, aliases: ["caracas", "ccs", "distrito capital", "dc"] },
  { nombre: "Maracaibo", estado: "Zulia", lat: 10.6666, lng: -71.6125, aliases: ["maracaibo", "mcy", "zulia"] },
  { nombre: "Valencia", estado: "Carabobo", lat: 10.162, lng: -68.0077, aliases: ["valencia", "vlc", "carabobo"] },
  { nombre: "Barquisimeto", estado: "Lara", lat: 10.0678, lng: -69.3467, aliases: ["barquisimeto", "bqto", "lara"] },
  { nombre: "Maracay", estado: "Aragua", lat: 10.2469, lng: -67.5958, aliases: ["maracay", "aragua"] },
  { nombre: "Mérida", estado: "Mérida", lat: 8.5897, lng: -71.1561, aliases: ["merida", "mrd"] },
  { nombre: "San Cristóbal", estado: "Táchira", lat: 7.7669, lng: -72.225, aliases: ["san cristobal", "sancristobal", "tachira"] },
  { nombre: "Ciudad Bolívar", estado: "Bolívar", lat: 8.1222, lng: -63.55, aliases: ["ciudad bolivar", "bolivar"] },
  { nombre: "Cumaná", estado: "Sucre", lat: 10.4533, lng: -64.1822, aliases: ["cumana", "sucre"] },
  { nombre: "Barcelona", estado: "Anzoátegui", lat: 10.1333, lng: -64.6833, aliases: ["barcelona", "anzoategui"] },
  { nombre: "Puerto La Cruz", estado: "Anzoátegui", lat: 10.2167, lng: -64.6167, aliases: ["puerto la cruz", "plc"] },
  { nombre: "Maturín", estado: "Monagas", lat: 9.745, lng: -63.183, aliases: ["maturin", "monagas"] },
  { nombre: "Barinas", estado: "Barinas", lat: 8.6226, lng: -70.2075, aliases: ["barinas"] },
  { nombre: "Ciudad Guayana", estado: "Bolívar", lat: 8.3512, lng: -62.641, aliases: ["ciudad guayana", "puerto ordaz", "guayana"] },
  { nombre: "Punto Fijo", estado: "Falcón", lat: 11.6915, lng: -70.1985, aliases: ["punto fijo", "falcon"] },
  { nombre: "Acarigua", estado: "Portuguesa", lat: 9.5545, lng: -69.2019, aliases: ["acarigua", "portuguesa"] },
  { nombre: "Guanare", estado: "Portuguesa", lat: 9.0418, lng: -69.7421, aliases: ["guanare"] },
  { nombre: "Puerto Cabello", estado: "Carabobo", lat: 10.4731, lng: -68.0125, aliases: ["puerto cabello"] },
  { nombre: "El Tigre", estado: "Anzoátegui", lat: 8.8875, lng: -64.2528, aliases: ["el tigre"] },
  { nombre: "Los Teques", estado: "Miranda", lat: 10.3445, lng: -67.039, aliases: ["los teques", "miranda"] },
  { nombre: "La Guaira", estado: "La Guaira", lat: 10.599, lng: -66.9346, aliases: ["la guaira", "vargas", "litoral"] },
  { nombre: "Porlamar", estado: "Nueva Esparta", lat: 10.957, lng: -63.849, aliases: ["porlamar", "margarita", "nueva esparta"] },
  { nombre: "Carúpano", estado: "Sucre", lat: 10.6678, lng: -63.258, aliases: ["carupano"] },
  { nombre: "Guarenas", estado: "Miranda", lat: 10.47, lng: -66.61, aliases: ["guarenas"] },
  { nombre: "Guatire", estado: "Miranda", lat: 10.476, lng: -66.543, aliases: ["guatire"] },
  { nombre: "San Fernando de Apure", estado: "Apure", lat: 7.888, lng: -67.472, aliases: ["san fernando de apure", "apure"] },
  { nombre: "Trujillo", estado: "Trujillo", lat: 9.3667, lng: -70.4333, aliases: ["trujillo"] },
  { nombre: "Coro", estado: "Falcón", lat: 11.4045, lng: -69.6734, aliases: ["coro"] },
  { nombre: "Valera", estado: "Trujillo", lat: 9.3178, lng: -70.6036, aliases: ["valera"] },
  { nombre: "Cabimas", estado: "Zulia", lat: 10.399, lng: -71.446, aliases: ["cabimas"] },
  { nombre: "El Vigía", estado: "Mérida", lat: 8.6135, lng: -71.657, aliases: ["el vigia"] },
  { nombre: "Calabozo", estado: "Guárico", lat: 8.924, lng: -67.429, aliases: ["calabozo", "guarico"] },
];

/** Los 23 estados de Venezuela y el Distrito Capital, con sus principales ciudades. */
export const VENEZUELA_STATES: VenezuelaState[] = [
  { nombre: "Amazonas", ciudades: ["Puerto Ayacucho", "San Fernando de Atabapo", "San Carlos de Río Negro"] },
  { nombre: "Anzoátegui", ciudades: ["Barcelona", "Puerto La Cruz", "Lechería", "El Tigre"] },
  { nombre: "Apure", ciudades: ["San Fernando de Apure", "Guasdualito"] },
  { nombre: "Aragua", ciudades: ["Maracay", "La Victoria", "Turmero"] },
  { nombre: "Barinas", ciudades: ["Barinas", "Socopó"] },
  { nombre: "Bolívar", ciudades: ["Ciudad Bolívar", "Ciudad Guayana", "Upata"] },
  { nombre: "Carabobo", ciudades: ["Valencia", "Puerto Cabello", "Guacara"] },
  { nombre: "Cojedes", ciudades: ["San Carlos", "Tinaquillo"] },
  { nombre: "Delta Amacuro", ciudades: ["Tucupita"] },
  { nombre: "Distrito Capital", ciudades: ["Caracas"] },
  { nombre: "Falcón", ciudades: ["Coro", "Punto Fijo", "Dabajuro"] },
  { nombre: "Guárico", ciudades: ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"] },
  { nombre: "La Guaira", ciudades: ["La Guaira", "Catia La Mar", "Maiquetía"] },
  { nombre: "Lara", ciudades: ["Barquisimeto", "Carora", "El Tocuyo"] },
  { nombre: "Mérida", ciudades: ["Mérida", "El Vigía", "Ejido"] },
  { nombre: "Miranda", ciudades: ["Los Teques", "Guarenas", "Guatire", "Petare"] },
  { nombre: "Monagas", ciudades: ["Maturín", "Caripito"] },
  { nombre: "Nueva Esparta", ciudades: ["La Asunción", "Porlamar", "Pampatar"] },
  { nombre: "Portuguesa", ciudades: ["Guanare", "Acarigua", "Araure"] },
  { nombre: "Sucre", ciudades: ["Cumaná", "Carúpano", "Güiria"] },
  { nombre: "Táchira", ciudades: ["San Cristóbal", "Táriba", "La Grita"] },
  { nombre: "Trujillo", ciudades: ["Trujillo", "Valera", "Boconó"] },
  { nombre: "Yaracuy", ciudades: ["San Felipe", "Chivacoa"] },
  { nombre: "Zulia", ciudades: ["Maracaibo", "Cabimas", "Ciudad Ojeda", "Machiques"] },
];

/** Normaliza texto para comparar sin acentos, mayúsculas ni signos. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Verifica si un punto está dentro de Venezuela. */
export function isInVenezuela(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= VENEZUELA_LAT_MIN &&
    lat <= VENEZUELA_LAT_MAX &&
    lng >= VENEZUELA_LNG_MIN &&
    lng <= VENEZUELA_LNG_MAX
  );
}

/** Devuelve la ciudad venezolana más cercana a un punto. */
export function nearestVenezuelaCity(lat: number, lng: number): VenezuelaCity | null {
  if (!isInVenezuela(lat, lng)) return null;
  let best: VenezuelaCity | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of VENEZUELA_CITIES) {
    const dLat = city.lat - lat;
    const dLng = city.lng - lng;
    const distance = dLat * dLat + dLng * dLng;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = city;
    }
  }
  return best;
}

/** Busca una ciudad venezolana por nombre, alias o estado. */
export function findVenezuelaCity(query: string): VenezuelaCity | null {
  const normalized = normalizeText(query);
  if (!normalized) return null;

  const direct = VENEZUELA_CITIES.find((city) =>
    city.aliases.includes(normalized) ||
    normalizeText(city.nombre) === normalized ||
    normalizeText(city.estado) === normalized
  );
  if (direct) return direct;

  // "caracas venezuela", "maracaibo estado zulia", etc.
  const stripped = normalized.replace(/\bvenezuela\b/g, "").replace(/\bestado\b/g, "").trim();
  if (stripped !== normalized) {
    return VENEZUELA_CITIES.find((city) =>
      city.aliases.includes(stripped) ||
      normalizeText(city.nombre) === stripped ||
      normalizeText(city.estado) === stripped
    ) ?? null;
  }

  return null;
}

/** Expande abreviaturas típicas usadas en direcciones venezolanas. */
export function expandVenezuelanAddress(query: string): string {
  return query
    .replace(/\bc\/c\b/gi, "calle")
    .replace(/\bavda\.?\b/gi, "avenida")
    .replace(/\bav\.?\b/gi, "avenida")
    .replace(/\bcl\.?\b/gi, "calle")
    .replace(/\burb\.?\b/gi, "urbanización")
    .replace(/\burba\.?\b/gi, "urbanización")
    .replace(/\bctro\.?\b/gi, "centro")
    .replace(/\bcc\.?\b/gi, "centro comercial")
    .replace(/\bsta\.?\b/gi, "santa")
    .replace(/\bsto\.?\b/gi, "santo")
    .replace(/\bpq\.?\b/gi, "parque")
    .replace(/\bqta\.?\b/gi, "quinta")
    .replace(/\bedif\.?\b/gi, "edificio")
    .replace(/\bres\.?\b/gi, "residencias")
    .replace(/\bvia\.?\b/gi, "avenida")
    .replace(/\bauto\.?\b/gi, "autopista")
    .replace(/\bautop\.?\b/gi, "autopista")
    .replace(/\bterm\.?\b/gi, "terminal")
    .replace(/\buniv\.?\b/gi, "universidad")
    .replace(/\bcolegio\b/gi, "colegio")
    .replace(/\s+/g, " ")
    .trim();
}
