export interface Trip {
  id: string;
  distanceKm: number;
  consumptionKmPerLiter: number;
  pricePerLiter: number;
  roundTrip: boolean;
  numberOfPeople: number;
  totalDistanceKm: number;
  requiredLiters: number;
  totalCost: number;
  costPerKm: number;
  costPerPerson?: number;
  createdAt: string;
}

export type NewTripInput = Omit<Trip, 'id' | 'createdAt'>;