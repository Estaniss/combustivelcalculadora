export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Raio médio da Terra em metros (IUGG). */
const EARTH_RADIUS_METERS = 6_371_008.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Distância em metros sobre a superfície da Terra entre dois pontos (fórmula de Haversine). */
export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}
