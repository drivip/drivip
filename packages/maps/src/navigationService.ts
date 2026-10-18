const OSRM_BASE = "https://router.project-osrm.org";

export interface NavStep {
  instruction: string;
  type: "depart" | "turn" | "new name" | "continue" | "arrive" | "merge" | "on ramp" | "off ramp" | "fork" | "end of road" | "roundabout";
  modifier: "left" | "right" | "slight left" | "slight right" | "sharp left" | "sharp right" | "straight" | "uturn" | "";
  streetName: string;
  distance: number;
  duration: number;
  startLocation: [number, number];
}

export interface NavRoute {
  geometry: [number, number][];
  steps: NavStep[];
  totalDistance: number;
  totalDuration: number;
}

function mapInstruction(maneuver: { type: string; modifier?: string }): string {
  const { type, modifier } = maneuver;
  if (type === "arrive") return "Llegaste a tu destino";
  if (type === "depart") return "Sal en la dirección indicada";
  const dirMap: Record<string, string> = {
    "left": "Gira a la izquierda",
    "right": "Gira a la derecha",
    "slight left": "Gira levemente a la izquierda",
    "slight right": "Gira levemente a la derecha",
    "sharp left": "Gira fuerte a la izquierda",
    "sharp right": "Gira fuerte a la derecha",
    "straight": "Sigue derecho",
    "uturn": "Da la vuelta",
    "": "Sigue derecho",
  };
  return dirMap[modifier || ""] || dirMap["straight"];
}

function getIconForManeuver(type: string, modifier?: string): string {
  if (type === "arrive") return "location_on";
  if (type === "depart") return "play_arrow";
  const iconMap: Record<string, string> = {
    "left": "turn_left",
    "right": "turn_right",
    "slight left": "turn_left",
    "slight right": "turn_right",
    "sharp left": "turn_left",
    "sharp right": "turn_right",
    "straight": "straight",
    "uturn": "u_turn_left",
  };
  return iconMap[modifier || ""] || "straight";
}

export async function fetchRoute(
  from: [number, number],
  to: [number, number]
): Promise<NavRoute | null> {
  try {
    const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
    const params = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      steps: "true",
      annotations: "true",
    });
    const res = await fetch(`${OSRM_BASE}/route/v1/driving/${coords}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;
    const route = data.routes[0];
    const leg = route.legs[0];
    const geometry: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );
    const steps: NavStep[] = leg.steps.map((step: Record<string, unknown>) => {
      const m = step.maneuver as Record<string, unknown>;
      const loc = m.location as [number, number];
      return {
        instruction: mapInstruction(m as { type: string; modifier?: string }),
        type: m.type as NavStep["type"],
        modifier: (m.modifier as string) || "",
        streetName: (step.name as string) || "",
        distance: step.distance as number,
        duration: step.duration as number,
        startLocation: [loc[1], loc[0]],
      };
    });
    return {
      geometry,
      steps,
      totalDistance: route.distance,
      totalDuration: route.duration,
    };
  } catch {
    return null;
  }
}

export function getDistanceToRoute(
  position: [number, number],
  routeGeometry: [number, number][]
): number {
  let minDist = Infinity;
  const R = 6371000;
  for (let i = 0; i < routeGeometry.length - 1; i++) {
    const p = routeGeometry[i];
    const q = routeGeometry[i + 1];
    const dLat = (q[0] - p[0]) * Math.PI / 180;
    const dLng = (q[1] - p[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(p[0] * Math.PI / 180) *
        Math.cos(q[0] * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const segmentLen = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (segmentLen < 0.01) continue;
    const t = Math.max(
      0,
      Math.min(1,
        ((position[0] - p[0]) * (q[0] - p[0]) + (position[1] - p[1]) * (q[1] - p[1])) /
        (segmentLen * segmentLen / (R * R))
      )
    );
    const projLat = p[0] + t * (q[0] - p[0]);
    const projLng = p[1] + t * (q[1] - p[1]);
    const dLat2 = (position[0] - projLat) * Math.PI / 180;
    const dLng2 = (position[1] - projLng) * Math.PI / 180;
    const a2 =
      Math.sin(dLat2 / 2) ** 2 +
      Math.cos(position[0] * Math.PI / 180) *
        Math.cos(projLat * Math.PI / 180) *
        Math.sin(dLng2 / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

export function findNearestStepIndex(
  position: [number, number],
  steps: NavStep[]
): number {
  let minDist = Infinity;
  let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    const dLat = (position[0] - steps[i].startLocation[0]) * Math.PI / 180;
    const dLng = (position[1] - steps[i].startLocation[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(position[0] * Math.PI / 180) *
        Math.cos(steps[i].startLocation[0] * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) *
      Math.cos(b[0] * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function calcBearing(from: [number, number], to: [number, number]): number {
  const dLng = (to[1] - from[1]) * Math.PI / 180;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export { getIconForManeuver };
