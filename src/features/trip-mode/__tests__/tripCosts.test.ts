import { computeTripCosts, describeTripSavings, FuelSetup } from '../services/tripCosts';
import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';

const gasoline: FuelSetup = { price: 6.2, consumption: 12 };
const ethanol: FuelSetup = { price: 4.2, consumption: 8.5 };

describe('computeTripCosts', () => {
  it('calcula o custo com o combustível usado e com o concorrente', () => {
    const summary = computeTripCosts({ distanceKm: 100, fuel: 'ethanol', gasoline, ethanol });
    expect(summary.cost).toBeCloseTo((100 / 8.5) * 4.2, 6);
    expect(summary.alternativeCost).toBeCloseTo((100 / 12) * 6.2, 6);
    expect(summary.litersUsed).toBeCloseTo(100 / 8.5, 6);
    expect(summary.savings).toBeCloseTo(summary.alternativeCost - summary.cost, 6);
    expect(summary.verdict).toBe('saved');
    expect(summary.alternativeFuel).toBe('gasoline');
  });

  it('inverte quando o escolhido saiu mais caro', () => {
    const summary = computeTripCosts({ distanceKm: 100, fuel: 'gasoline', gasoline, ethanol });
    expect(summary.savings).toBeLessThan(0);
    expect(summary.verdict).toBe('extra');
  });

  it('empata quando custam o mesmo', () => {
    const summary = computeTripCosts({
      distanceKm: 100,
      fuel: 'gasoline',
      gasoline: { price: 6, consumption: 12 },
      ethanol: { price: 4, consumption: 8 },
    });
    expect(summary.verdict).toBe('same');
  });

  it('viagem de 0 km custa 0', () => {
    const summary = computeTripCosts({ distanceKm: 0, fuel: 'ethanol', gasoline, ethanol });
    expect(summary.cost).toBe(0);
    expect(summary.verdict).toBe('same');
  });

  it('rejeita entradas inválidas', () => {
    const base = { distanceKm: 10, fuel: 'ethanol' as const, gasoline, ethanol };
    expect(() => computeTripCosts({ ...base, distanceKm: -1 })).toThrow(InvalidInputError);
    expect(() => computeTripCosts({ ...base, distanceKm: NaN })).toThrow(InvalidInputError);
    expect(() => computeTripCosts({ ...base, ethanol: { price: 0, consumption: 8 } })).toThrow(
      InvalidInputError,
    );
    expect(() => computeTripCosts({ ...base, gasoline: { price: 6, consumption: 0 } })).toThrow(
      InvalidInputError,
    );
  });
});

describe('describeTripSavings', () => {
  it('fala em economia só quando houve economia', () => {
    const saved = describeTripSavings(
      computeTripCosts({ distanceKm: 100, fuel: 'ethanol', gasoline, ethanol }),
    );
    expect(saved).toContain('Você economizou');
    expect(saved).toContain('usando Etanol em vez de Gasolina');

    const extra = describeTripSavings(
      computeTripCosts({ distanceKm: 100, fuel: 'gasoline', gasoline, ethanol }),
    );
    expect(extra).toContain('pagou');
    expect(extra).toContain('a mais');
    expect(extra).not.toContain('economizou');
  });
});
