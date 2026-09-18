import { calculateAverageConsumption } from '../services/consumptionCalculator';
import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';

describe('calculateAverageConsumption', () => {
  it('calcula consumo corretamente', () => {
    const result = calculateAverageConsumption({
      previousOdometer: 50000,
      currentOdometer: 50450,
      liters: 37.5,
    });
    expect(result.distanceKm).toBe(450);
    expect(result.consumptionKmPerLiter).toBe(12);
  });

  it('calcula custo quando preço é informado', () => {
    const result = calculateAverageConsumption({
      previousOdometer: 50000,
      currentOdometer: 50450,
      liters: 37.5,
      pricePerLiter: 6.2,
    });
    expect(result.refuelingCost).toBeCloseTo(232.5, 2);
    expect(result.costPerKm).toBeCloseTo(0.5167, 3);
  });

  it('rejeita litros zero', () => {
    expect(() =>
      calculateAverageConsumption({ previousOdometer: 100, currentOdometer: 200, liters: 0 }),
    ).toThrow(InvalidInputError);
  });

  it('rejeita odômetro atual menor ou igual ao anterior', () => {
    expect(() =>
      calculateAverageConsumption({ previousOdometer: 500, currentOdometer: 500, liters: 10 }),
    ).toThrow(InvalidInputError);
    expect(() =>
      calculateAverageConsumption({ previousOdometer: 500, currentOdometer: 400, liters: 10 }),
    ).toThrow(InvalidInputError);
  });

  it('rejeita distância inválida (odômetro negativo)', () => {
    expect(() =>
      calculateAverageConsumption({ previousOdometer: -10, currentOdometer: 100, liters: 10 }),
    ).toThrow(InvalidInputError);
  });
});
