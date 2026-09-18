import {
  calculateRequiredFuel,
  calculateTripCost,
  calculateCostPerKm,
  calculateCostPerPerson,
  calculateTrip,
  InvalidInputError,
} from '../services/tripCalculator';

describe('calculateRequiredFuel', () => {
  it('calcula litros necessários corretamente', () => {
    expect(calculateRequiredFuel(500, 12)).toBeCloseTo(41.67, 1);
  });
  it('rejeita distância zero ou negativa', () => {
    expect(() => calculateRequiredFuel(0, 12)).toThrow(InvalidInputError);
    expect(() => calculateRequiredFuel(-10, 12)).toThrow(InvalidInputError);
  });
  it('rejeita consumo inválido', () => {
    expect(() => calculateRequiredFuel(100, 0)).toThrow(InvalidInputError);
  });
});

describe('calculateTripCost', () => {
  it('calcula o custo corretamente', () => {
    expect(calculateTripCost(41.67, 6.2)).toBeCloseTo(258.35, 1);
  });
  it('rejeita preço inválido', () => {
    expect(() => calculateTripCost(10, 0)).toThrow(InvalidInputError);
  });
});

describe('calculateCostPerKm', () => {
  it('calcula custo por km', () => {
    expect(calculateCostPerKm(6.2, 12)).toBeCloseTo(0.5167, 3);
  });
});

describe('calculateCostPerPerson', () => {
  it('divide entre 1 pessoa (retorna o valor total)', () => {
    expect(calculateCostPerPerson(300, 1)).toBe(300);
  });
  it('divide entre múltiplas pessoas', () => {
    expect(calculateCostPerPerson(300, 4)).toBe(75);
  });
  it('rejeita quantidade inválida de pessoas', () => {
    expect(() => calculateCostPerPerson(300, 0)).toThrow(InvalidInputError);
  });
});

describe('calculateTrip (ida e volta)', () => {
  it('dobra a distância quando roundTrip é true', () => {
    const result = calculateTrip({
      distanceKm: 500,
      consumptionKmPerLiter: 12,
      pricePerLiter: 6.2,
      roundTrip: true,
    });
    expect(result.totalDistanceKm).toBe(1000);
  });

  it('calcula custo por pessoa quando informado', () => {
    const result = calculateTrip({
      distanceKm: 500,
      consumptionKmPerLiter: 12,
      pricePerLiter: 6.2,
      roundTrip: false,
      numberOfPeople: 4,
    });
    expect(result.costPerPerson).toBeCloseTo(result.totalCost / 4, 5);
  });

  it('não calcula custo por pessoa com 1 pessoa', () => {
    const result = calculateTrip({
      distanceKm: 500,
      consumptionKmPerLiter: 12,
      pricePerLiter: 6.2,
      roundTrip: false,
      numberOfPeople: 1,
    });
    expect(result.costPerPerson).toBeUndefined();
  });
});
