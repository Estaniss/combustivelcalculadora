import { mapConfig } from '@config/map.config';
import { Coordinates } from '@features/trip-mode/services/geo';
import { safeJson } from './mapMessages';

export interface MapHtmlOptions {
  center: Coordinates;
  dark: boolean;
  zoom?: number;
}

/**
 * Página do mapa (Leaflet + tiles configurados em map.config.ts).
 *
 * Segurança: nomes de postos vêm do OpenStreetMap (texto de terceiros). Aqui
 * eles só entram via setAttribute/textContent — nunca innerHTML —, e todos os
 * dados chegam por mensagens JSON, não por interpolação no HTML.
 */
export function buildMapHtml({
  center,
  dark,
  zoom = mapConfig.defaultZoom,
}: MapHtmlOptions): string {
  const config = {
    center: [center.latitude, center.longitude],
    zoom,
    tileUrl: mapConfig.tileUrl,
    attribution: mapConfig.tileAttribution,
    maxZoom: mapConfig.maxZoom,
    dark,
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="${mapConfig.leaflet.cssUrl}" integrity="${mapConfig.leaflet.cssIntegrity}" crossorigin="">
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8e6df; }
  body.dark { background: #0a0a0a; }
  body.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9); }
  .pin { width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.35); background: #1a4a6f; }
  .pin.open { background: #1a7f4b; } .pin.closed { background: #8a8f98; }
  .pin.selected { width: 38px; height: 38px; }
  .user { width: 16px; height: 16px; border-radius: 50%; background: #2563eb; border: 3px solid #fff;
          box-shadow: 0 0 0 6px rgba(37,99,235,.25); }
</style>
</head>
<body class="${dark ? 'dark' : ''}">
<div id="map"></div>
<script src="${mapConfig.leaflet.jsUrl}" integrity="${mapConfig.leaflet.jsIntegrity}" crossorigin=""></script>
<script>
(function () {
  var cfg = ${safeJson(config)};
  var map = L.map('map', { zoomControl: true }).setView(cfg.center, cfg.zoom);
  L.tileLayer(cfg.tileUrl, { maxZoom: cfg.maxZoom, attribution: cfg.attribution }).addTo(map);

  var userMarker = null, userPos = null, stationLayer = L.layerGroup().addTo(map);

  function post(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  function pinIcon(station, selected) {
    var state = station.openNow === true ? 'open' : station.openNow === false ? 'closed' : '';
    return L.divIcon({
      className: '',
      html: '<div class="pin ' + state + (selected ? ' selected' : '') + '"></div>',
      iconSize: selected ? [38, 38] : [30, 30],
      iconAnchor: selected ? [19, 38] : [15, 30]
    });
  }

  function setStations(stations, selectedId) {
    stationLayer.clearLayers();
    stations.forEach(function (s) {
      var marker = L.marker([s.latitude, s.longitude], {
        icon: pinIcon(s, s.id === selectedId),
        title: String(s.name),
        keyboard: true
      });
      marker.on('click', function () { post({ type: 'stationPress', id: s.id }); });
      marker.addTo(stationLayer);
    });
  }

  function setUser(lat, lon) {
    userPos = [lat, lon];
    if (!userMarker) {
      userMarker = L.marker(userPos, {
        icon: L.divIcon({ className: '', html: '<div class="user"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
        interactive: false, keyboard: false
      }).addTo(map);
    } else {
      userMarker.setLatLng(userPos);
    }
  }

  window.__receive = function (msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'setStations') setStations(msg.stations || [], msg.selectedId);
    else if (msg.type === 'setUser') setUser(msg.latitude, msg.longitude);
    else if (msg.type === 'recenter' && userPos) map.setView(userPos, cfg.zoom);
    else if (msg.type === 'panTo') map.panTo([msg.latitude, msg.longitude]);
    else if (msg.type === 'setTheme') document.body.className = msg.dark ? 'dark' : '';
  };

  post({ type: 'ready' });
})();
</script>
</body>
</html>`;
}
