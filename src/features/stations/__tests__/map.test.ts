import { mapConfig } from '@config/map.config';
import { buildMapHtml } from '../services/mapHtml';
import { commandScript, parseMapEvent, safeJson } from '../services/mapMessages';

describe('safeJson', () => {
  it('escapa </script> e separadores de linha, e continua sendo JSON válido', () => {
    const value = { name: '</script><script>alert(1)</script>', note: 'a\u2028b\u2029c & <b>' };
    const text = safeJson(value);
    expect(text).not.toContain('</script>');
    expect(text).not.toContain('<');
    expect(text).not.toContain('\u2028');
    expect(JSON.parse(text)).toEqual(value);
  });
});

describe('parseMapEvent', () => {
  it('aceita ready e stationPress', () => {
    expect(parseMapEvent('{"type":"ready"}')).toEqual({ type: 'ready' });
    expect(parseMapEvent('{"type":"stationPress","id":"osm-node-1"}')).toEqual({
      type: 'stationPress',
      id: 'osm-node-1',
    });
  });

  it.each([
    'não é json',
    'null',
    '42',
    '{"type":"outra"}',
    '{"type":"stationPress"}',
    '{"type":"stationPress","id":5}',
    `{"type":"stationPress","id":"${'x'.repeat(101)}"}`,
  ])('rejeita "%s"', (raw) => {
    expect(parseMapEvent(raw)).toBeNull();
  });
});

describe('commandScript', () => {
  it('entrega o comando a window.__receive e termina com true;', () => {
    const script = commandScript({ type: 'recenter' });
    expect(script).toBe('window.__receive({"type":"recenter"}); true;');
  });
});

describe('buildMapHtml', () => {
  const center = { latitude: -23.55, longitude: -46.63 };

  it('carrega o Leaflet com verificação de integridade (SRI)', () => {
    const html = buildMapHtml({ center, dark: false });
    expect(html).toContain(`integrity="${mapConfig.leaflet.jsIntegrity}"`);
    expect(html).toContain(`integrity="${mapConfig.leaflet.cssIntegrity}"`);
    expect(html).toContain(mapConfig.leaflet.jsUrl);
  });

  it('usa a URL de tiles e a atribuição da configuração', () => {
    const html = buildMapHtml({ center, dark: false });
    expect(html).toContain('tile.openstreetmap.org');
    expect(html).toContain('OpenStreetMap');
  });

  it('marca o tema escuro e nunca usa innerHTML', () => {
    expect(buildMapHtml({ center, dark: true })).toContain('<body class="dark">');
    expect(buildMapHtml({ center, dark: false })).toContain('<body class="">');
    expect(buildMapHtml({ center, dark: false })).not.toContain('innerHTML');
  });

  describe('o script embutido, executado com um Leaflet falso', () => {
    function run(dark = false) {
      const html = buildMapHtml({ center, dark });
      const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
      const body = scripts[scripts.length - 1]?.[1] ?? '';

      interface FakeMarker {
        on: jest.Mock;
        addTo: () => FakeMarker;
        setLatLng: jest.Mock;
      }
      interface FakeLayer {
        clearLayers: () => void;
        addTo: () => FakeLayer;
      }
      interface FakeMap {
        setView: jest.Mock<FakeMap, [unknown, number]>;
        panTo: jest.Mock;
      }

      const markers: { latlng: unknown; options: { title?: string } }[] = [];
      const posted: unknown[] = [];
      const layer: FakeLayer = {
        clearLayers: () => {
          markers.splice(0);
        },
        addTo: () => layer,
      };
      const fakeMap: FakeMap = {
        setView: jest.fn((_center: unknown, _zoom: number) => fakeMap),
        panTo: jest.fn(),
      };
      const L = {
        map: jest.fn(() => fakeMap),
        tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
        layerGroup: jest.fn(() => layer),
        divIcon: jest.fn((options: unknown) => options),
        marker: jest.fn((latlng: unknown, options: { title?: string }): FakeMarker => {
          const marker: FakeMarker = {
            on: jest.fn(),
            addTo: () => {
              markers.push({ latlng, options });
              return marker;
            },
            setLatLng: jest.fn(),
          };
          return marker;
        }),
      };
      const win: Record<string, unknown> = {
        ReactNativeWebView: { postMessage: (m: string) => posted.push(JSON.parse(m)) },
      };
      const doc = { body: { className: dark ? 'dark' : '' } };

      new Function('L', 'window', 'document', body)(L, win, doc);
      return { win, doc, L, markers, posted, fakeMap };
    }

    it('executa sem erro, centraliza o mapa e avisa "ready"', () => {
      const { L, posted, fakeMap } = run();
      expect(L.map).toHaveBeenCalled();
      expect(fakeMap.setView).toHaveBeenCalledWith(
        [center.latitude, center.longitude],
        mapConfig.defaultZoom,
      );
      expect(posted).toEqual([{ type: 'ready' }]);
    });

    it('desenha os postos usando o nome só como atributo title (texto puro)', () => {
      const { win, markers } = run();
      const evil = '<img src=x onerror=alert(1)>';
      (win.__receive as (m: unknown) => void)({
        type: 'setStations',
        stations: [{ id: 'a', name: evil, latitude: 1, longitude: 2, openNow: true }],
      });
      expect(markers).toHaveLength(1);
      expect(markers[0]?.options.title).toBe(evil);
    });

    it('panTo leva o mapa até o posto escolhido', () => {
      const { win, fakeMap } = run();
      (win.__receive as (m: unknown) => void)({ type: 'panTo', latitude: -23.6, longitude: -46.7 });
      expect(fakeMap.panTo).toHaveBeenCalledWith([-23.6, -46.7]);
    });

    it('troca o tema e ignora comandos inválidos', () => {
      const { win, doc } = run(false);
      const receive = win.__receive as (m: unknown) => void;
      receive({ type: 'setTheme', dark: true });
      expect(doc.body.className).toBe('dark');
      expect(() => receive(null)).not.toThrow();
      expect(() => receive('texto')).not.toThrow();
      expect(() => receive({ type: 'desconhecido' })).not.toThrow();
    });
  });
});
