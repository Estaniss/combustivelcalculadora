export type FuelType = 'gasoline' | 'ethanol' | 'flex' | 'diesel';

/** Tipos de veículo que o usuário pode escolher (cada um tem um desenho em VehicleGlyph). */
export const VEHICLE_ICONS = ['car', 'suv', 'van', 'pickup', 'moto', 'taxi'] as const;
export type VehicleIcon = (typeof VEHICLE_ICONS)[number];

/** Nome em português, usado por leitores de tela. */
export const VEHICLE_ICON_LABELS: Record<VehicleIcon, string> = {
  car: 'Carro',
  suv: 'SUV',
  van: 'Van',
  pickup: 'Picape',
  moto: 'Moto',
  taxi: 'Táxi',
};

/** Versões anteriores guardavam um emoji; converte para o tipo atual. */
const LEGACY_EMOJI: Record<string, VehicleIcon> = {
  '🚗': 'car',
  '🚙': 'suv',
  '🚐': 'van',
  '🛻': 'pickup',
  '🏍️': 'moto',
  '🚕': 'taxi',
};

/** Aceita qualquer valor salvo (inclusive emoji antigo ou lixo) e devolve um tipo válido. */
export function normalizeVehicleIcon(value: unknown): VehicleIcon {
  if (typeof value === 'string') {
    if ((VEHICLE_ICONS as readonly string[]).includes(value)) return value as VehicleIcon;
    const legacy = LEGACY_EMOJI[value];
    if (legacy) return legacy;
  }
  return 'car';
}

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
