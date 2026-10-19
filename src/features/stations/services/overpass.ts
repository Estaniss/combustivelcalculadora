import { mapConfig } from '@config/map.config';
import { Station } from '@/domain/station';
import { Coordinates } from '@features/trip-mode/services/geo';
import { isOpenNow } from './openingHours';

export class StationsUnavailableError extends Error {
  constructor() {
    super('Não foi possível buscar os postos agora.');
    this.name = 'StationsUnavailableError';
  }
}

export function buildOverpassQuery(
  { latitude, longitude }: Coordinates,
  radiusMeters: number,
  limit: number,
): string {
  const around = `(around:${Math.round(radiusMeters)},${latitude},${longitude})`;
  return `[out:json][timeout:15];(node["amenity"="fuel"]${around};way["amenity"="fuel"]${around};);out center tags ${limit};`;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function buildAddress(tags: Record<string, unknown>): string | undefined {
  const street = str(tags['addr:street']);
  const number = str(tags['addr:housenumber']);
  const suburb = str(tags['addr:suburb']);
  const city = str(tags['addr:city']);

  const streetLine = street ? (number ? `${street}, ${number}` : street) : undefined;
  const parts = [streetLine, suburb, city].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' - ') : undefined;
}

/**
 * Converte a resposta do Overpass em postos. Dados do OSM são digitados por
 * voluntários: tudo é validado e o que não servir é ignorado (nunca lança).
 */
export function parseOverpassElements(elements: unknown, now: Date = new Date()): Station[] {
  if (!Array.isArray(elements)) return [];

  const stations = new Map<string, Station>();
  for (const element of elements) {
    if (typeof element !== 'object' || element === null) continue;
    const item = element as Record<string, unknown>;

    const type = item.type;
    const osmId = item.id;
    if (typeof type !== 'string' || typeof osmId !== 'number') continue;

    const center = (item.center ?? {}) as Record<string, unknown>;
    const latitude = typeof item.lat === 'number' ? item.lat : center.lat;
    const longitude = typeof item.lon === 'number' ? item.lon : center.lon;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') continue;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;

    const tags = (item.tags ?? {}) as Record<string, unknown>;
    const id = `osm-${type}-${osmId}`;
    stations.set(id, {
      id,
      name: str(tags.name) ?? str(tags.brand) ?? str(tags.operator) ?? 'Posto de combustível',
      address: buildAddress(tags),
      latitude,
      longitude,
      brand: str(tags.brand),
      openNow: isOpenNow(str(tags.opening_hours), now),
    });
  }
  return [...stations.values()];
}

type FetchLike = (
  url: string,
  init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
  },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export interface FetchStationsOptions {
  fetchImpl?: FetchLike;
  endpoints?: readonly string[];
  radiusMeters?: number;
  limit?: number;
  timeoutMs?: number;
  now?: Date;
  /** Cache (injetável nos testes). */
  cache?: Map<string, { at: number; stations: Station[] }>;
  cacheTtlMs?: number;
}

const defaultCache = new Map<string, { at: number; stations: Station[] }>();

/** Esvazia o cache (útil em testes ou num botão "atualizar"). */
export function clearStationsCache(): void {
  defaultCache.clear();
}

/**
 * Chave de cache: arredonda a posição para ~1 km (2 casas decimais), então
 * andar poucas quadras não dispara uma nova consulta aos servidores públicos.
 */
function cacheKey({ latitude, longitude }: Coordinates, radius: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)},${radius}`;
}

async function queryEndpoint(
  fetchImpl: FetchLike,
  endpoint: string,
  query: string,
  timeoutMs: number,
): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': mapConfig.userAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Busca postos perto de `origin`. Tenta cada instância do Overpass em ordem;
 * se todas falharem, lança StationsUnavailableError (a tela mostra "tentar de novo").
 */
export async function fetchNearbyStations(
  origin: Coordinates,
  {
    fetchImpl = fetch as unknown as FetchLike,
    endpoints = mapConfig.overpassEndpoints,
    radiusMeters = mapConfig.stationsRadiusMeters,
    limit = mapConfig.stationsLimit,
    timeoutMs = mapConfig.requestTimeoutMs,
    now = new Date(),
    cache = defaultCache,
    cacheTtlMs = mapConfig.cacheTtlMs,
  }: FetchStationsOptions = {},
): Promise<Station[]> {
  const key = cacheKey(origin, radiusMeters);
  const cached = cache.get(key);
  if (cached && now.getTime() - cached.at < cacheTtlMs) return cached.stations;

  const query = buildOverpassQuery(origin, radiusMeters, limit);
  for (const endpoint of endpoints) {
    const json = await queryEndpoint(fetchImpl, endpoint, query, timeoutMs);
    if (json === null || typeof json !== 'object') continue;

    const stations = parseOverpassElements((json as { elements?: unknown }).elements, now);
    cache.set(key, { at: now.getTime(), stations });
    return stations;
  }
  throw new StationsUnavailableError();
}
