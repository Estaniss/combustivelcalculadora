import { calculateMonthStatistics } from '../services/statisticsCalculator';
import { Refueling } from '@/domain/refueling';

function makeRefueling(overrides: Partial<Refueling>): Refueling {
  return {
    id: overrides.id ?? Math.random().toString(),
    vehicleId: 'v1',
    date: overrides.date ?? '2026-09-10T00:00:00.000Z',
    odometer: overrides.odometer ?? 0,
    liters: overrides.liters ?? 0,
    pricePerLiter: overrides.pricePerLiter ?? 0,
    totalCost: (overrides.liters ?? 0) * (overrides.pricePerLiter ?? 0),
    fuelType: overrides.fuelType ?? 'gasoline',
    fullTank: overrides.fullTank ?? true,
    createdAt: overrides.date ?? '2026-09-10T00:00:00.000Z',
  };
}

describe('calculateMonthStatistics', () => {
  const reference = new Date('2026-09-15T00:00:00.000Z');

  it('soma gasto e litros do mês', () => {
    const refuelings = [
      makeRefueling({
        date: '2026-09-01T00:00:00.000Z',
        odometer: 1000,
        liters: 40,
        pricePerLiter: 6,
      }),
      makeRefueling({
        date: '2026-09-10T00:00:00.000Z',
        odometer: 1450,
        liters: 38,
        pricePerLiter: 6.1,
      }),
    ];
    const stats = calculateMonthStatistics(refuelings, reference);
    expect(stats.refuelingCount).toBe(2);
    expect(stats.totalLiters).toBeCloseTo(78, 2);
  });

  it('estima distância pela diferença de odômetro entre abastecimentos', () => {
    const refuelings = [
      makeRefueling({
        date: '2026-09-01T00:00:00.000Z',
        odometer: 1000,
        liters: 40,
        pricePerLiter: 6,
      }),
      makeRefueling({
        date: '2026-09-10T00:00:00.000Z',
        odometer: 1450,
        liters: 38,
        pricePerLiter: 6.1,
      }),
    ];
    const stats = calculateMonthStatistics(refuelings, reference);
    expect(stats.estimatedDistanceKm).toBe(450);
    expect(stats.averageConsumption).toBeCloseTo(450 / 78, 3);
  });

  it('ignora abastecimentos de outros meses', () => {
    const refuelings = [
      makeRefueling({
        date: '2026-08-01T00:00:00.000Z',
        odometer: 500,
        liters: 30,
        pricePerLiter: 6,
      }),
      makeRefueling({
        date: '2026-09-05T00:00:00.000Z',
        odometer: 1000,
        liters: 35,
        pricePerLiter: 6,
      }),
    ];
    const stats = calculateMonthStatistics(refuelings, reference);
    expect(stats.refuelingCount).toBe(1);
  });

  it('retorna consumo nulo com menos de 2 registros no mês', () => {
    const refuelings = [
      makeRefueling({
        date: '2026-09-05T00:00:00.000Z',
        odometer: 1000,
        liters: 35,
        pricePerLiter: 6,
      }),
    ];
    const stats = calculateMonthStatistics(refuelings, reference);
    expect(stats.averageConsumption).toBeNull();
  });
});
