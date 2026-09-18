import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';

export interface ConsumptionInput {
  previousOdometer: number;
  currentOdometer: number;
  liters: number;
  pricePerLiter?: number;
}

export interface ConsumptionResult {
  distanceKm: number;
  consumptionKmPerLiter: number;
  costPerKm?: number;
  costPer100Km?: number;
  refuelingCost?: number;
}

export function calculateAverageConsumption(input: ConsumptionInput): ConsumptionResult {
  const { previousOdometer, currentOdometer, liters, pricePerLiter } = input;

  if (
    Number.isNaN(previousOdometer) ||
    Number.isNaN(currentOdometer) ||
    previousOdometer < 0 ||
    currentOdometer < 0
  ) {
    throw new InvalidInputError('Informe valores de odômetro válidos.');
  }
  if (currentOdometer <= previousOdometer) {
    throw new InvalidInputError('O odômetro atual deve ser maior que o anterior.');
  }
  if (Number.isNaN(liters) || liters <= 0) {
    throw new InvalidInputError('Informe uma quantidade de litros válida.');
  }

  const distanceKm = currentOdometer - previousOdometer;
  const consumptionKmPerLiter = distanceKm / liters;

  const result: ConsumptionResult = { distanceKm, consumptionKmPerLiter };

  if (pricePerLiter && pricePerLiter > 0) {
    const refuelingCost = liters * pricePerLiter;
    result.refuelingCost = refuelingCost;
    result.costPerKm = refuelingCost / distanceKm;
    result.costPer100Km = result.costPerKm * 100;
  }

  return result;
}
