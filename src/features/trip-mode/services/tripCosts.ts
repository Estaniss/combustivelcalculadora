import { formatCurrency } from '@utils/format';
import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';

export type FuelChoice = 'gasoline' | 'ethanol';

export interface FuelSetup {
  /** Preço por litro (R$). */
  price: number;
  /** Consumo do veículo com este combustível (km/L). */
  consumption: number;
}

export interface TripCostInput {
  distanceKm: number;
  /** Combustível realmente usado na viagem. */
  fuel: FuelChoice;
  gasoline: FuelSetup;
  ethanol: FuelSetup;
}

export interface TripCostSummary {
  distanceKm: number;
  fuel: FuelChoice;
  alternativeFuel: FuelChoice;
  litersUsed: number;
  cost: number;
  alternativeLiters: number;
  alternativeCost: number;
  /** alternativeCost − cost: positivo = economizou; negativo = pagou a mais. */
  savings: number;
  verdict: 'saved' | 'extra' | 'same';
}

const FUEL_LABEL: Record<FuelChoice, string> = { gasoline: 'Gasolina', ethanol: 'Etanol' };
/** Diferenças menores que meio centavo contam como empate. */
const SAME_THRESHOLD = 0.005;

function assertSetup(setup: FuelSetup, label: string): void {
  if (!Number.isFinite(setup.price) || setup.price <= 0) {
    throw new InvalidInputError(`Informe um preço válido para ${label}.`);
  }
  if (!Number.isFinite(setup.consumption) || setup.consumption <= 0) {
    throw new InvalidInputError(`Informe um consumo válido para ${label}.`);
  }
}

/** Custo do trajeto com o combustível usado e com o concorrente. */
export function computeTripCosts(input: TripCostInput): TripCostSummary {
  if (!Number.isFinite(input.distanceKm) || input.distanceKm < 0) {
    throw new InvalidInputError('A distância não pode ser negativa.');
  }
  assertSetup(input.gasoline, 'a gasolina');
  assertSetup(input.ethanol, 'o etanol');

  const used = input[input.fuel];
  const alternativeFuel: FuelChoice = input.fuel === 'gasoline' ? 'ethanol' : 'gasoline';
  const alternative = input[alternativeFuel];

  const litersUsed = input.distanceKm / used.consumption;
  const alternativeLiters = input.distanceKm / alternative.consumption;
  const cost = litersUsed * used.price;
  const alternativeCost = alternativeLiters * alternative.price;
  const savings = alternativeCost - cost;

  return {
    distanceKm: input.distanceKm,
    fuel: input.fuel,
    alternativeFuel,
    litersUsed,
    cost,
    alternativeLiters,
    alternativeCost,
    savings,
    verdict: Math.abs(savings) < SAME_THRESHOLD ? 'same' : savings > 0 ? 'saved' : 'extra',
  };
}

/** Frase do resumo da viagem. Não chama de "economia" quando o escolhido saiu mais caro. */
export function describeTripSavings(summary: TripCostSummary): string {
  const used = FUEL_LABEL[summary.fuel];
  const other = FUEL_LABEL[summary.alternativeFuel];
  switch (summary.verdict) {
    case 'saved':
      return `Você economizou ${formatCurrency(summary.savings)} usando ${used} em vez de ${other}.`;
    case 'extra':
      return `Com ${used} você pagou ${formatCurrency(-summary.savings)} a mais do que pagaria com ${other}.`;
    default:
      return `${used} e ${other} custariam o mesmo nesta viagem.`;
  }
}
