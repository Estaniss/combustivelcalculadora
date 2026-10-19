import { addFix, createTracker, LocationFix, trackerDistanceKm } from '../services/tripTracker';

/** ~11,1 m por 0,0001° de latitude. */
const METERS_PER_DEGREE_LAT = 111_194.93;
const fixAt = (northMeters: number, seconds: number, accuracy: number | null = 5): LocationFix => ({
  latitude: -23 + northMeters / METERS_PER_DEGREE_LAT,
  longitude: -46,
  timestamp: Date.UTC(2026, 0, 1, 12, 0, seconds),
  accuracy,
});

function run(fixes: LocationFix[]) {
  // não passar addFix direto: reduce entregaria o índice como 3º argumento (limits)
  return fixes.reduce((state, fix) => addFix(state, fix), createTracker());
}

describe('tripTracker', () => {
  it('acumula a distância de um trecho em linha reta', () => {
    // 100 m a cada 5 s (72 km/h), durante 1 km
    const fixes = Array.from({ length: 11 }, (_, i) => fixAt(i * 100, i * 5));
    const state = run(fixes);
    expect(state.distanceMeters).toBeCloseTo(1000, 0);
    expect(trackerDistanceKm(state)).toBeCloseTo(1, 3);
    expect(state.acceptedFixes).toBe(11);
  });

  it('carro parado com GPS oscilando não soma distância', () => {
    const jitter = [0, 2, -1, 3, -2, 1, 2, -3, 1, 0];
    const state = run(jitter.map((offset, i) => fixAt(offset, i * 3)));
    expect(state.distanceMeters).toBe(0);
  });

  it('movimento lento real acumula até passar do ruído (referência não anda)', () => {
    // 1 m a cada 2 s: cada passo é < 5 m, mas em 20 leituras andou 20 m
    const fixes = Array.from({ length: 21 }, (_, i) => fixAt(i, i * 2));
    const state = run(fixes);
    expect(state.distanceMeters).toBeGreaterThan(15);
    expect(state.distanceMeters).toBeLessThanOrEqual(20.5);
  });

  it('descarta leituras imprecisas', () => {
    const state = run([fixAt(0, 0), fixAt(500, 10, 120), fixAt(100, 10)]);
    expect(state.rejectedFixes).toBe(1);
    expect(state.distanceMeters).toBeCloseTo(100, 0);
  });

  it('descarta salto impossível (teletransporte do GPS)', () => {
    const state = run([fixAt(0, 0), fixAt(50_000, 5), fixAt(100, 10)]);
    expect(state.rejectedFixes).toBe(1);
    expect(state.distanceMeters).toBeCloseTo(100, 0);
  });

  it('aceita o deslocamento grande depois de um intervalo longo (túnel)', () => {
    const state = run([fixAt(0, 0), fixAt(1500, 60)]); // 25 m/s ≈ 90 km/h
    expect(state.distanceMeters).toBeCloseTo(1500, 0);
  });

  it('descarta leitura fora de ordem ou repetida no tempo', () => {
    const state = run([fixAt(0, 10), fixAt(100, 5), fixAt(100, 10)]);
    expect(state.rejectedFixes).toBe(2);
    expect(state.distanceMeters).toBe(0);
  });

  it('aceita leitura sem accuracy informada', () => {
    const state = run([fixAt(0, 0, null), fixAt(100, 5, null)]);
    expect(state.distanceMeters).toBeCloseTo(100, 0);
  });

  it('com limites customizados, o limite de precisão é respeitado', () => {
    const strict = { maxAccuracyMeters: 3, minStepMeters: 5, maxSpeedMetersPerSecond: 70 };
    const state = [fixAt(0, 0), fixAt(100, 5)].reduce(
      (s, f) => addFix(s, f, strict),
      createTracker(),
    );
    expect(state.acceptedFixes).toBe(0); // accuracy 5 > 3: todas rejeitadas
    expect(state.rejectedFixes).toBe(2);
  });

  it('não altera o estado anterior (função pura)', () => {
    const before = run([fixAt(0, 0)]);
    const snapshot = JSON.stringify(before);
    addFix(before, fixAt(100, 5));
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});
