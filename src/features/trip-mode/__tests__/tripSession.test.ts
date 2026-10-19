import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';
import {
  discardSession,
  finishSession,
  getActiveSession,
  handleLocationBatch,
  liveSnapshot,
  STALE_AFTER_MS,
  startSession,
  subscribeToSession,
  tripInputFromFinished,
  TripSetup,
} from '../services/tripSession';
import { LocationFix } from '../services/tripTracker';

const METERS_PER_DEGREE_LAT = 111_194.93;
const fix = (northMeters: number, seconds: number): LocationFix => ({
  latitude: -23 + northMeters / METERS_PER_DEGREE_LAT,
  longitude: -46,
  timestamp: Date.UTC(2026, 0, 1, 12, 0, seconds),
  accuracy: 5,
});

const setup: TripSetup = {
  fuel: 'ethanol',
  gasoline: { price: 6.2, consumption: 12 },
  ethanol: { price: 4.2, consumption: 8.5 },
  vehicleName: 'Meu carro',
};

describe('tripSession', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sem sessão ativa, lotes de GPS são ignorados e finish devolve null', async () => {
    expect(await getActiveSession()).toBeNull();
    expect(await handleLocationBatch([fix(0, 0)])).toBeNull();
    expect(await finishSession()).toBeNull();
  });

  it('percorre o ciclo: iniciar → lotes → resumo, e limpa o estado', async () => {
    await startSession(setup, 1_000);
    await handleLocationBatch([fix(0, 0), fix(100, 5)], 2_000);
    await handleLocationBatch([fix(200, 10), fix(300, 15)], 3_000);

    const active = await getActiveSession();
    expect(active?.tracker.distanceMeters).toBeCloseTo(300, 0);
    expect(active?.lastUpdateAt).toBe(3_000);

    const finished = await finishSession();
    expect(finished?.summary.distanceKm).toBeCloseTo(0.3, 3);
    expect(finished?.summary.cost).toBeCloseTo((0.3 / 8.5) * 4.2, 4);
    expect(await getActiveSession()).toBeNull();
  });

  it('não perde distância quando dois lotes chegam ao mesmo tempo', async () => {
    await startSession(setup);
    await handleLocationBatch([fix(0, 0)]);
    await Promise.all([
      handleLocationBatch([fix(100, 5)]),
      handleLocationBatch([fix(200, 10)]),
      handleLocationBatch([fix(300, 15)]),
    ]);
    expect((await getActiveSession())?.tracker.distanceMeters).toBeCloseTo(300, 0);
  });

  it('ordena leituras fora de ordem dentro do mesmo lote', async () => {
    await startSession(setup);
    await handleLocationBatch([fix(100, 5), fix(0, 0), fix(200, 10)]);
    expect((await getActiveSession())?.tracker.distanceMeters).toBeCloseTo(200, 0);
  });

  it('rejeita configuração inválida sem criar sessão', async () => {
    await expect(
      startSession({ ...setup, ethanol: { price: 0, consumption: 8.5 } }),
    ).rejects.toBeInstanceOf(InvalidInputError);
    expect(await getActiveSession()).toBeNull();
  });

  it('avisa os ouvintes a cada mudança e para depois de cancelar a inscrição', async () => {
    const seen: (number | null)[] = [];
    const unsubscribe = subscribeToSession((s) => seen.push(s ? s.tracker.distanceMeters : null));

    await startSession(setup);
    await handleLocationBatch([fix(0, 0), fix(100, 5)]);
    await finishSession();
    expect(seen).toHaveLength(3);
    expect(seen[0]).toBe(0);
    expect(seen[1]).toBeCloseTo(100, 0);
    expect(seen[2]).toBeNull();

    unsubscribe();
    await startSession(setup);
    expect(seen).toHaveLength(3);
    await discardSession();
  });

  it('discardSession apaga a viagem sem gerar resumo', async () => {
    await startSession(setup);
    await discardSession();
    expect(await getActiveSession()).toBeNull();
  });

  it('liveSnapshot calcula distância, custo, tempo e detecta GPS parado', async () => {
    const session = await startSession(setup, 10_000);
    const updated = await handleLocationBatch([fix(0, 0), fix(1000, 60)], 20_000);
    if (!updated) throw new Error('sessão deveria existir');

    const fresh = liveSnapshot(updated, 25_000);
    expect(fresh.distanceKm).toBeCloseTo(1, 2);
    expect(fresh.cost).toBeCloseTo((1 / 8.5) * 4.2, 4);
    expect(fresh.elapsedMs).toBe(15_000);
    expect(fresh.stale).toBe(false);

    const stale = liveSnapshot(updated, 20_000 + STALE_AFTER_MS + 1);
    expect(stale.stale).toBe(true);
    expect(session.id).toBe(updated.id);
  });

  it('sobrevive a "reabrir o app": o estado vem do armazenamento', async () => {
    await startSession(setup, 1_000);
    await handleLocationBatch([fix(0, 0), fix(500, 30)], 2_000);
    const reloaded = await getActiveSession(); // outra leitura = outro "processo"
    expect(reloaded?.tracker.distanceMeters).toBeCloseTo(500, 0);
    expect(reloaded?.setup.vehicleName).toBe('Meu carro');
  });
});

describe('tripInputFromFinished', () => {
  it('converte para o histórico de viagens marcando a origem GPS', async () => {
    await AsyncStorage.clear();
    await startSession(setup);
    await handleLocationBatch([fix(0, 0), fix(2000, 100)]);
    const finished = await finishSession();
    if (!finished) throw new Error('viagem deveria existir');

    const input = tripInputFromFinished(finished);
    expect(input.source).toBe('gps');
    expect(input.totalDistanceKm).toBeCloseTo(2, 2);
    expect(input.pricePerLiter).toBe(4.2);
    expect(input.consumptionKmPerLiter).toBe(8.5);
    expect(input.totalCost).toBeCloseTo((2 / 8.5) * 4.2, 4);
    expect(input.costPerKm).toBeCloseTo(4.2 / 8.5, 6);
    expect(input.roundTrip).toBe(false);
  });
});
