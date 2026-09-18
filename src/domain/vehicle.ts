export type FuelType = 'gasoline' | 'ethanol' | 'flex' | 'diesel';

export interface Vehicle {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  fuelType: FuelType;
  averageConsumption?: number; // km/L
  createdAt: string;
  updatedAt: string;
}

export type NewVehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
