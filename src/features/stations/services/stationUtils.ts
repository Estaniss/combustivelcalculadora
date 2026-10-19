import { Station } from '@/domain/station';
import { Coordinates, haversineMeters } from '@features/trip-mode/services/geo';
import { formatNumber } from '@utils/format';

export type StationWithDistance = Station & { distanceMeters: number };

/** Ordena do mais perto para o mais longe a partir de `origin`. */
export function sortByDistance(stations: Station[], origin: Coordinates): StationWithDistance[] {
  return stations
    .map((station) => ({ ...station, distanceMeters: haversineMeters(origin, station) }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/** 450 -> "450 m"; 1250 -> "1,3 km". */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${formatNumber(meters / 1000, 1)} km`;
}

/** Texto do indicador aberto/fechado. Não afirma "fechado" quando a fonte não sabe. */
export function openStatusLabel(openNow: boolean | undefined): string {
  if (openNow === true) return 'Aberto agora';
  if (openNow === false) return 'Fechado agora';
  return 'Horário não informado';
}

export interface DirectionsLinks {
  googleMaps: string;
  waze: string;
  appleMaps: string;
}

/** Links "Como chegar" (rota de carro até o posto) para cada app de navegação. */
export function buildDirectionsLinks({ latitude, longitude }: Coordinates): DirectionsLinks {
  const destination = `${latitude},${longitude}`;
  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${destination}&navigate=yes`,
    appleMaps: `https://maps.apple.com/?daddr=${destination}&dirflg=d`,
  };
}
