import { Coordinates } from '@features/trip-mode/services/geo';

/** Mensagens do app (React Native) para o mapa (WebView). */
export type MapCommand =
  | {
      type: 'setStations';
      stations: {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        openNow?: boolean;
      }[];
      selectedId?: string | null;
    }
  | { type: 'setUser'; latitude: number; longitude: number }
  | { type: 'recenter' }
  | { type: 'panTo'; latitude: number; longitude: number }
  | { type: 'setTheme'; dark: boolean };

/** Mensagens do mapa (WebView) para o app. */
export type MapEvent = { type: 'ready' } | { type: 'stationPress'; id: string };

/**
 * JSON seguro para embutir dentro de <script>: escapa "<", ">" e "&" (evita
 * fechar a tag com "</script>") e os separadores de linha U+2028/U+2029.
 */
export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** Script que entrega um comando ao mapa via injectJavaScript. */
export function commandScript(command: MapCommand): string {
  return `window.__receive(${safeJson(command)}); true;`;
}

/** Valida o texto recebido do WebView. Qualquer coisa fora do formato vira null. */
export function parseMapEvent(raw: string): MapEvent | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const event = data as Record<string, unknown>;

  if (event.type === 'ready') return { type: 'ready' };
  if (event.type === 'stationPress' && typeof event.id === 'string' && event.id.length <= 100) {
    return { type: 'stationPress', id: event.id };
  }
  return null;
}

export type MapOrigin = Coordinates;
