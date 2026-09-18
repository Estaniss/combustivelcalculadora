export class InvalidInputError extends Error {}

function assertPositive(value: number, fieldName: string): void {
  if (Number.isNaN(value) || !Number.isFinite(value) || value <= 0) {
    throw new InvalidInputError(`${fieldName} deve ser maior que zero.`);
  }
}

export interface TripCalculationInput {
  distanceKm: number;
  consumptionKmPerLiter: number;
  pricePerLiter: number;
  roundTrip: boolean;
  numberOfPeople?: number;
}

export interface TripCalculationResult {
  totalDistanceKm: number;
  requiredLiters: number;
  totalCost: number;
  costPerKm: number;
  costPerPerson?: number;
}

/** litros = distância / consumo */
export function calculateRequiredFuel(distanceKm: number, consumptionKmPerLiter: number): number {
  assertPositive(distanceKm, 'A distância');
  assertPositive(consumptionKmPerLiter, 'O consumo');
  return distanceKm / consumptionKmPerLiter;
}

/** custo = litros × preçoPorLitro */
export function calculateTripCost(liters: number, pricePerLiter: number): number {
  assertPositive(pricePerLiter, 'O preço do combustível');
  if (liters < 0 || !Number.isFinite(liters)) {
    throw new InvalidInputError('Quantidade de litros inválida.');
  }
  return liters * pricePerLiter;
}

/** custoPorKm = preçoPorLitro / consumo */
export function calculateCostPerKm(pricePerLiter: number, consumptionKmPerLiter: number): number {
  assertPositive(pricePerLiter, 'O preço do combustível');
  assertPositive(consumptionKmPerLiter, 'O consumo');
  return pricePerLiter / consumptionKmPerLiter;
}

/** custoPorPessoa = custoTotal / quantidadeDePessoas */
export function calculateCostPerPerson(totalCost: number, numberOfPeople: number): number {
  if (!Number.isInteger(numberOfPeople) || numberOfPeople < 1) {
    throw new InvalidInputError('Informe pelo menos 1 pessoa.');
  }
  if (totalCost < 0 || !Number.isFinite(totalCost)) {
    throw new InvalidInputError('Custo total inválido.');
  }
  return totalCost / numberOfPeople;
}

export function calculateTrip(input: TripCalculationInput): TripCalculationResult {
  const { distanceKm, consumptionKmPerLiter, pricePerLiter, roundTrip, numberOfPeople } = input;

  const totalDistanceKm = roundTrip ? distanceKm * 2 : distanceKm;
  const requiredLiters = calculateRequiredFuel(totalDistanceKm, consumptionKmPerLiter);
  const totalCost = calculateTripCost(requiredLiters, pricePerLiter);
  const costPerKm = calculateCostPerKm(pricePerLiter, consumptionKmPerLiter);

  const result: TripCalculationResult = {
    totalDistanceKm,
    requiredLiters,
    totalCost,
    costPerKm,
  };

  if (numberOfPeople && numberOfPeople > 1) {
    result.costPerPerson = calculateCostPerPerson(totalCost, numberOfPeople);
  }

  return result;
}
