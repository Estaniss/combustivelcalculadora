import { Refueling } from '@/domain/refueling';

export interface MonthStatistics {
  totalSpent: number;
  totalLiters: number;
  estimatedDistanceKm: number;
  averageConsumption: number | null;
  averageCostPerKm: number | null;
  refuelingCount: number;
}

function isSameMonth(dateIso: string, reference: Date): boolean {
  const date = new Date(dateIso);

  return (
    date.getUTCFullYear() === reference.getUTCFullYear() &&
    date.getUTCMonth() === reference.getUTCMonth()
  );
}

/**
 * Calcula estatísticas do mês a partir do histórico de abastecimentos de
 * um veículo, ordenado ou não. A distância estimada é a soma das
 * diferenças de odômetro entre abastecimentos consecutivos (ordenados
 * cronologicamente) — por isso precisa de pelo menos 2 registros no
 * período para estimar distância/consumo com segurança.
 */
export function calculateMonthStatistics(
  refuelings: Refueling[],
  referenceDate: Date = new Date(),
): MonthStatistics {
  const sorted = [...refuelings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const monthRefuelings = sorted.filter((r) => isSameMonth(r.date, referenceDate));

  const totalSpent = monthRefuelings.reduce((sum, r) => sum + r.totalCost, 0);
  const totalLiters = monthRefuelings.reduce((sum, r) => sum + r.liters, 0);

  let estimatedDistanceKm = 0;
  for (let i = 1; i < monthRefuelings.length; i++) {
    const current = monthRefuelings[i];
    const previous = monthRefuelings[i - 1];
    if (!current || !previous) continue;
    const distance = current.odometer - previous.odometer;
    if (distance > 0) estimatedDistanceKm += distance;
  }

  const averageConsumption =
    estimatedDistanceKm > 0 && totalLiters > 0 ? estimatedDistanceKm / totalLiters : null;

  const averageCostPerKm =
    estimatedDistanceKm > 0 && totalSpent > 0 ? totalSpent / estimatedDistanceKm : null;

  return {
    totalSpent,
    totalLiters,
    estimatedDistanceKm,
    averageConsumption,
    averageCostPerKm,
    refuelingCount: monthRefuelings.length,
  };
}
