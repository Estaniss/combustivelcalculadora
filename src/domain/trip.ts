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
  /** Como a viagem foi registrada: calculada à mão ou medida por GPS. */
  source?: 'manual' | 'gps';
  createdAt: string;
}

export type NewTripInput = Omit<Trip, 'id' | 'createdAt'>;
