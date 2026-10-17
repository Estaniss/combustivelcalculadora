export type FuelType = 'gasoline' | 'ethanol' | 'flex' | 'diesel';

export const VEHICLE_ICONS = ['🚗', '🚙', '🚐', '🛻', '🏍️', '🚕'] as const;
export type VehicleIcon = (typeof VEHICLE_ICONS)[number];

export interface Vehicle {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  fuelType: FuelType;
  /** Consumo médio genérico (km/L). Mantido por compatibilidade com cadastros antigos. */
  averageConsumption?: number;
  /** Consumo específico com gasolina (km/L). */
  gasolineConsumption?: number;
  /** Consumo específico com etanol (km/L). */
  ethanolConsumption?: number;
  /** Capacidade do tanque em litros — usada para estimar a economia por tanque. */
  tankCapacityLiters?: number;
  icon: VehicleIcon;
  createdAt: string;
  updatedAt: string;
}

export type NewVehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
/**
 * Consumo (km/L) do veículo para o combustível pedido.
 * Usa o valor específico; só cai no consumo médio genérico quando ele faz
 * sentido (ex: não aplica a média de um flex ao etanol, que rende bem menos).
 */
export function getVehicleConsumption(
  vehicle: Vehicle,
  fuel: 'gasoline' | 'ethanol',
): number | undefined {
  if (fuel === 'gasoline') {
    if (vehicle.gasolineConsumption) return vehicle.gasolineConsumption;
    const usesGasoline = vehicle.fuelType === 'gasoline' || vehicle.fuelType === 'flex';
    return usesGasoline ? vehicle.averageConsumption : undefined;
  }
  if (vehicle.ethanolConsumption) return vehicle.ethanolConsumption;
  return vehicle.fuelType === 'ethanol' ? vehicle.averageConsumption : undefined;
}
