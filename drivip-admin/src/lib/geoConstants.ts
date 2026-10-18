export const VENEZUELA_CITIES = {
  caracas: { lat: 10.4806, lng: -66.9036, zoom: 12 },
  valencia: { lat: 10.162, lng: -68.0077, zoom: 12 },
  maracaibo: { lat: 10.6544, lng: -71.6294, zoom: 12 },
  maracay: { lat: 10.2354, lng: -67.5958, zoom: 12 },
  barquisimeto: { lat: 10.0647, lng: -69.357, zoom: 12 },
  puerto_ordaz: { lat: 8.2867, lng: -62.7054, zoom: 12 },
  merida: { lat: 8.5897, lng: -71.1561, zoom: 12 },
} as const;

export const DEFAULT_CITY = VENEZUELA_CITIES.caracas;

export const MAP_CONFIG = {
  defaultZoom: 14,
  coverageRadius: 3000,
  maxCoverageRadius: 10000,
  minCoverageRadius: 1000,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
