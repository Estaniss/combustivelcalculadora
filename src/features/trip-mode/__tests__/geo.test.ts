import { haversineMeters } from '../services/geo';

describe('haversineMeters', () => {
  it('é zero para o mesmo ponto', () => {
    const point = { latitude: -23.55, longitude: -46.63 };
    expect(haversineMeters(point, point)).toBe(0);
  });

  it('1° de latitude no equador ≈ 111,19 km', () => {
    const meters = haversineMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(meters).toBeCloseTo(111_194.93, 0);
  });

  it('São Paulo → Rio de Janeiro fica a menos de 0,5% da distância geodésica WGS84', () => {
    // Referência: 361,3 km no elipsoide WGS84 (conferido com pyproj). A esfera do
    // Haversine dá ~360,7 km — o erro é bem menor que o ruído típico do GPS.
    const meters = haversineMeters(
      { latitude: -23.5505, longitude: -46.6333 },
      { latitude: -22.9068, longitude: -43.1729 },
    );
    expect(Math.abs(meters - 361_300) / 361_300).toBeLessThan(0.005);
  });

  it('é simétrica', () => {
    const a = { latitude: -23.5, longitude: -46.6 };
    const b = { latitude: -22.9, longitude: -43.2 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });

  it('funciona atravessando o antimeridiano', () => {
    const meters = haversineMeters(
      { latitude: 0, longitude: 179.9 },
      { latitude: 0, longitude: -179.9 },
    );
    expect(meters).toBeCloseTo(22_239, -1); // 0,2° ≈ 22,2 km, não 40.000 km
  });
});
