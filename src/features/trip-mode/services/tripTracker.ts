import { Coordinates, haversineMeters } from './geo';

export interface LocationFix extends Coordinates {
  /** Instante da leitura, em milissegundos. */
  timestamp: number;
  /** Erro estimado da posição, em metros (null/undefined = desconhecido). */
  accuracy?: number | null;
}

export interface TrackerState {
  distanceMeters: number;
  lastFix: LocationFix | null;
  acceptedFixes: number;
  rejectedFixes: number;
}

export interface TrackerLimits {
  /** Leituras com erro maior que isso são descartadas. */
  maxAccuracyMeters: number;
  /** Menor deslocamento contado como movimento (piso do ruído do GPS parado). */
  minStepMeters: number;
  /** Velocidade acima disso entre duas leituras é tratada como "salto" falso do GPS. */
  maxSpeedMetersPerSecond: number;
}

export const DEFAULT_TRACKER_LIMITS: TrackerLimits = {
  maxAccuracyMeters: 30,
  minStepMeters: 5,
  maxSpeedMetersPerSecond: 70, // ≈ 252 km/h
};

export function createTracker(): TrackerState {
  return { distanceMeters: 0, lastFix: null, acceptedFixes: 0, rejectedFixes: 0 };
}

/**
 * Soma uma nova leitura de GPS à distância percorrida (função pura).
 *
 * Regras para o ruído do GPS não inflar a distância:
 *  1. leitura imprecisa (accuracy alta) é descartada;
 *  2. leitura fora de ordem no tempo é descartada;
 *  3. deslocamento menor que o ruído esperado é ignorado, mas a posição de
 *     referência NÃO muda — assim um movimento lento real acumula até passar do
 *     limite, e um carro parado não "anda" por oscilação do sinal;
 *  4. velocidade impossível entre duas leituras é descartada como salto falso.
 */
export function addFix(
  state: TrackerState,
  fix: LocationFix,
  limits: TrackerLimits = DEFAULT_TRACKER_LIMITS,
): TrackerState {
  const reject = (): TrackerState => ({ ...state, rejectedFixes: state.rejectedFixes + 1 });

  if (fix.accuracy != null && fix.accuracy > limits.maxAccuracyMeters) return reject();

  const last = state.lastFix;
  if (!last) {
    return { ...state, lastFix: fix, acceptedFixes: state.acceptedFixes + 1 };
  }

  const seconds = (fix.timestamp - last.timestamp) / 1000;
  if (seconds <= 0) return reject();

  const step = haversineMeters(last, fix);
  const noiseFloor = Math.max(
    limits.minStepMeters,
    ((last.accuracy ?? 0) + (fix.accuracy ?? 0)) / 4,
  );
  if (step < noiseFloor) return state;

  if (step / seconds > limits.maxSpeedMetersPerSecond) return reject();

  return {
    distanceMeters: state.distanceMeters + step,
    lastFix: fix,
    acceptedFixes: state.acceptedFixes + 1,
    rejectedFixes: state.rejectedFixes,
  };
}

export function trackerDistanceKm(state: TrackerState): number {
  return state.distanceMeters / 1000;
}
