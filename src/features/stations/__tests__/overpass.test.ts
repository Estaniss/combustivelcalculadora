import {
  buildOverpassQuery,
  clearStationsCache,
  fetchNearbyStations,
  parseOverpassElements,
  StationsUnavailableError,
} from '../services/overpass';

const origin = { latitude: -23.55, longitude: -46.63 };
const now = new Date(2026, 9, 19, 10, 0); // segunda 10:00

describe('buildOverpassQuery', () => {
  it('busca nós e vias amenity=fuel ao redor do ponto', () => {
    const query = buildOverpassQuery(origin, 3000.4, 40);
    expect(query).toContain('node["amenity"="fuel"](around:3000,-23.55,-46.63)');
    expect(query).toContain('way["amenity"="fuel"](around:3000,-23.55,-46.63)');
    expect(query).toContain('out center tags 40;');
  });
});

describe('parseOverpassElements', () => {
  it('lê nós (lat/lon) e vias (center) e monta nome, endereço e aberto/fechado', () => {
    const stations = parseOverpassElements(
      [
        {
          type: 'node',
          id: 1,
          lat: -23.551,
          lon: -46.631,
          tags: {
            name: 'Posto Central',
            brand: 'Shell',
            'addr:street': 'Rua A',
            'addr:housenumber': '10',
            'addr:suburb': 'Centro',
            'addr:city': 'São Paulo',
            opening_hours: 'Mo-Su 06:00-22:00',
          },
        },
        { type: 'way', id: 2, center: { lat: -23.56, lon: -46.64 }, tags: { brand: 'Ipiranga' } },
      ],
      now,
    );

    expect(stations).toHaveLength(2);
    expect(stations[0]).toMatchObject({
      id: 'osm-node-1',
      name: 'Posto Central',
      brand: 'Shell',
      address: 'Rua A, 10 - Centro - São Paulo',
      openNow: true,
    });
    expect(stations[1]).toMatchObject({
      id: 'osm-way-2',
      name: 'Ipiranga',
      latitude: -23.56,
      longitude: -46.64,
    });
    expect(stations[1]?.openNow).toBeUndefined(); // sem horário: "não informado"
    expect(stations[1]?.address).toBeUndefined();
  });

  it('usa nome genérico quando não há name, brand nem operator', () => {
    const [station] = parseOverpassElements([{ type: 'node', id: 3, lat: 0, lon: 0 }], now);
    expect(station?.name).toBe('Posto de combustível');
  });

  it('ignora elementos inválidos, sem coordenadas ou fora do planeta', () => {
    const stations = parseOverpassElements(
      [
        null,
        'texto',
        { type: 'node', id: 'x', lat: 0, lon: 0 },
        { type: 'node', id: 4 },
        { type: 'node', id: 5, lat: 95, lon: 0 },
        { type: 'node', id: 6, lat: 1, lon: 1 },
      ],
      now,
    );
    expect(stations.map((s) => s.id)).toEqual(['osm-node-6']);
  });

  it('remove duplicados e aceita resposta que não é lista', () => {
    const element = { type: 'node', id: 7, lat: 1, lon: 1 };
    expect(parseOverpassElements([element, element], now)).toHaveLength(1);
    expect(parseOverpassElements({ not: 'a list' }, now)).toEqual([]);
    expect(parseOverpassElements(undefined, now)).toEqual([]);
  });

  it('mantém texto malicioso como texto puro (quem exibe é que não pode interpretar HTML)', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const [station] = parseOverpassElements(
      [{ type: 'node', id: 8, lat: 1, lon: 1, tags: { name: evil } }],
      now,
    );
    expect(station?.name).toBe(evil);
  });
});

describe('fetchNearbyStations', () => {
  const okResponse = (elements: unknown[]) => async () => ({
    ok: true,
    json: async () => ({ elements }),
  });
  const node = { type: 'node', id: 10, lat: -23.551, lon: -46.631, tags: { name: 'Posto' } };

  beforeEach(() => clearStationsCache());

  it('faz POST com a consulta codificada e devolve os postos', async () => {
    const calls: { url: string; body: string; method: string }[] = [];
    const stations = await fetchNearbyStations(origin, {
      endpoints: ['https://a.example/api'],
      now,
      fetchImpl: async (url, init) => {
        calls.push({ url, body: init.body, method: init.method });
        return { ok: true, json: async () => ({ elements: [node] }) };
      },
    });

    expect(stations.map((s) => s.name)).toEqual(['Posto']);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url).toBe('https://a.example/api');
    expect(calls[0]?.body.startsWith('data=')).toBe(true);
    expect(decodeURIComponent(calls[0]?.body.slice(5) ?? '')).toContain('amenity');
  });

  it('cai para a próxima instância quando a primeira falha', async () => {
    const urls: string[] = [];
    const stations = await fetchNearbyStations(origin, {
      endpoints: ['https://a.example', 'https://b.example', 'https://c.example'],
      now,
      fetchImpl: async (url) => {
        urls.push(url);
        if (url === 'https://a.example') throw new Error('rede');
        if (url === 'https://b.example') return { ok: false, json: async () => ({}) };
        return { ok: true, json: async () => ({ elements: [node] }) };
      },
    });
    expect(urls).toEqual(['https://a.example', 'https://b.example', 'https://c.example']);
    expect(stations).toHaveLength(1);
  });

  it('lança StationsUnavailableError quando todas falham', async () => {
    await expect(
      fetchNearbyStations(origin, {
        endpoints: ['https://a.example'],
        now,
        fetchImpl: async () => {
          throw new Error('rede');
        },
      }),
    ).rejects.toBeInstanceOf(StationsUnavailableError);
  });

  it('usa o cache na mesma região e refaz depois do prazo', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: true, json: async () => ({ elements: [node] }) };
    };
    const options = { endpoints: ['https://a.example'], fetchImpl, cacheTtlMs: 60_000 };

    await fetchNearbyStations(origin, { ...options, now });
    // andou ~100 m: mesma célula de ~1 km, não consulta de novo
    await fetchNearbyStations(
      { latitude: -23.5509, longitude: -46.6309 },
      { ...options, now: new Date(now.getTime() + 30_000) },
    );
    expect(calls).toBe(1);

    await fetchNearbyStations(origin, { ...options, now: new Date(now.getTime() + 61_000) });
    expect(calls).toBe(2);
  });

  it('desiste de uma instância lenta depois do tempo limite', async () => {
    const slowThenOk = async (
      url: string,
      init: { signal: AbortSignal },
    ): Promise<{ ok: boolean; json: () => Promise<unknown> }> => {
      if (url === 'https://slow.example') {
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        });
      }
      return okResponse([node])();
    };
    const stations = await fetchNearbyStations(origin, {
      endpoints: ['https://slow.example', 'https://fast.example'],
      timeoutMs: 20,
      now,
      fetchImpl: slowThenOk,
    });
    expect(stations).toHaveLength(1);
  });
});
