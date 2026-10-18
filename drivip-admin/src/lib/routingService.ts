interface RouteResult {
  distance: number;
  duration: number;
  geometry: [number, number][];
}

export async function getRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult | null> {
  try {
    const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const coordsArray = route.geometry.coordinates as [number, number][];

    return {
      distance: route.distance / 1000,
      duration: Math.round(route.duration / 60),
      geometry: coordsArray.map((c) => [c[1], c[0]]),
    };
  } catch {
    return null;
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}min`;
}
