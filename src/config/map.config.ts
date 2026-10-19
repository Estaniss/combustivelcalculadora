import { appConfig } from './app.config';

/**
 * Configuração do mapa e da busca de postos (OpenStreetMap + Leaflet).
 *
 * ATENÇÃO — política de uso dos tiles do OSM: o servidor público
 * tile.openstreetmap.org NÃO é para uso pesado. Distribuir um app com muitos
 * usuários sobre ele exige autorização do Operations Working Group do OSM.
 * Por isso a URL fica só aqui: antes do app crescer, troque `tileUrl` e
 * `tileAttribution` por um provedor com cota (MapTiler, Stadia, Thunderforest,
 * Carto…) — o resto do código não muda.
 */
export const mapConfig = {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  /** Atribuição obrigatória da licença ODbL. */
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  defaultZoom: 15,

  /** Origem das requisições do WebView (identifica o app para o OSM como "Referer"). */
  referer: 'https://github.com/Estaniss/combustivelcalculadora',
  userAgent: `Combustivel/${appConfig.appVersion} (${appConfig.androidPackageName})`,

  stationsRadiusMeters: 3000,
  stationsLimit: 40,
  /** Resultados repetidos na mesma região ficam em cache por este tempo. */
  cacheTtlMs: 10 * 60 * 1000,

  /** Instâncias públicas do Overpass, em ordem de preferência (há limites de uso). */
  overpassEndpoints: [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ],
  requestTimeoutMs: 15_000,

  /** Leaflet carregado do CDN com verificação de integridade (SRI). */
  leaflet: {
    jsUrl: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    jsIntegrity: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
    cssUrl: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    cssIntegrity: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
  },
} as const;
