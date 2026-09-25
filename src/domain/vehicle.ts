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
  averageConsumption?: number; // km/L
  icon: VehicleIcon;
  createdAt: string;
  updatedAt: string;
}

export type NewVehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;