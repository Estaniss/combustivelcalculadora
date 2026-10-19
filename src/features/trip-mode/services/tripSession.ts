import { storageService, StorageKeys } from '@services/storage/storageService';
import { NewTripInput } from '@/domain/trip';
import { addFix, createTracker, LocationFix, TrackerState, trackerDistanceKm } from './tripTracker';
import { computeTripCosts, FuelChoice, FuelSetup, TripCostSummary } from './tripCosts';

export interface TripSetup {
  fuel: FuelChoice;
  gasoline: FuelSetup;
  ethanol: FuelSetup;
  vehicleName?: string;
}

export interface TripSession {
  id: string;
  startedAt: number;
  /** Quando chegou o último lote de GPS (relógio do aparelho). */
  lastUpdateAt: number;
  tracker: TrackerState;
  setup: TripSetup;
}

/** Sem lote de GPS há mais que isso = rastreio provavelmente interrompido. */
export const STALE_AFTER_MS = 45_000;

type Listener = (session: TripSession | null) => void;
const listeners = new Set<Listener>();

/**
 * Fila: o serviço de GPS pode entregar lotes enquanto a tela lê/grava a sessão.
 * Serializar leitura-modificação-gravação evita perder distância por corrida.
 */
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job);
  queue = run.catch(() => undefined);
  return run;
}

function notify(session: TripSession | null): void {
  listeners.forEach((listener) => listener(session));
}

export function subscribeToSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActiveSession(): Promise<TripSession | null> {
  return storageService.getItem<TripSession>(StorageKeys.ACTIVE_TRIP_SESSION);
}

/** Valida preços/consumos (lança InvalidInputError) e abre uma nova sessão. */
export function startSession(setup: TripSetup, now: number = Date.now()): Promise<TripSession> {
  return enqueue(async () => {
    computeTripCosts({ distanceKm: 0, ...setup }); // só para validar a configuração
    const session: TripSession = {
      id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
      startedAt: now,
      lastUpdateAt: now,
      tracker: createTracker(),
      setup,
    };
    await storageService.setItem(StorageKeys.ACTIVE_TRIP_SESSION, session);
    notify(session);
    return session;
  });
}

/** Soma um lote de leituras de GPS à sessão ativa. Sem sessão ativa, não faz nada. */
export function handleLocationBatch(
  fixes: LocationFix[],
  now: number = Date.now(),
): Promise<TripSession | null> {
  return enqueue(async () => {
    const session = await getActiveSession();
    if (!session || fixes.length === 0) return session;

    const ordered = [...fixes].sort((a, b) => a.timestamp - b.timestamp);
    const tracker = ordered.reduce((state, fix) => addFix(state, fix), session.tracker);
    const updated: TripSession = { ...session, tracker, lastUpdateAt: now };

    await storageService.setItem(StorageKeys.ACTIVE_TRIP_SESSION, updated);
    notify(updated);
    return updated;
  });
}

export interface FinishedTrip {
  session: TripSession;
  summary: TripCostSummary;
}

/** Encerra a sessão: calcula o resumo final e apaga o estado temporário. */
export function finishSession(): Promise<FinishedTrip | null> {
  return enqueue(async () => {
    const session = await getActiveSession();
    if (!session) return null;

    const summary = computeTripCosts({
      distanceKm: trackerDistanceKm(session.tracker),
      ...session.setup,
    });
    await storageService.removeItem(StorageKeys.ACTIVE_TRIP_SESSION);
    notify(null);
    return { session, summary };
  });
}

/** Cancela a viagem sem gerar resumo. */
export function discardSession(): Promise<void> {
  return enqueue(async () => {
    await storageService.removeItem(StorageKeys.ACTIVE_TRIP_SESSION);
    notify(null);
  });
}

export interface LiveSnapshot {
  distanceKm: number;
  cost: number;
  elapsedMs: number;
  stale: boolean;
}

export function liveSnapshot(session: TripSession, now: number = Date.now()): LiveSnapshot {
  const distanceKm = trackerDistanceKm(session.tracker);
  const { cost } = computeTripCosts({ distanceKm, ...session.setup });
  return {
    distanceKm,
    cost,
    elapsedMs: Math.max(0, now - session.startedAt),
    stale: now - session.lastUpdateAt > STALE_AFTER_MS,
  };
}

/** Converte uma viagem medida por GPS no formato do histórico de viagens. */
export function tripInputFromFinished({ session, summary }: FinishedTrip): NewTripInput {
  const used = session.setup[session.setup.fuel];
  return {
    distanceKm: summary.distanceKm,
    consumptionKmPerLiter: used.consumption,
    pricePerLiter: used.price,
    roundTrip: false,
    numberOfPeople: 1,
    totalDistanceKm: summary.distanceKm,
    requiredLiters: summary.litersUsed,
    totalCost: summary.cost,
    costPerKm: used.price / used.consumption,
    source: 'gps',
  };
}
