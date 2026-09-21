export type RefuelingFuelType = 'gasoline' | 'ethanol' | 'diesel';

export interface Refueling {
  id: string;
  vehicleId: string;
  date: string; // ISO
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  fuelType: RefuelingFuelType;
  fullTank: boolean;
  establishment?: string;
  createdAt: string;
}

export type NewRefuelingInput = Omit<Refueling, 'id' | 'totalCost' | 'createdAt'>;