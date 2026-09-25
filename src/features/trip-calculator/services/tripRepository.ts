import { storageService, StorageKeys } from '@services/storage/storageService';
import { Trip, NewTripInput } from '@/domain/trip';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function getAll(): Promise<Trip[]> {
  const trips = await storageService.getItem<Trip[]>(StorageKeys.TRIPS);
  return (trips ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function saveAll(trips: Trip[]): Promise<void> {
  await storageService.setItem(StorageKeys.TRIPS, trips);
}

async function create(input: NewTripInput): Promise<Trip> {
  const trips = await storageService.getItem<Trip[]>(StorageKeys.TRIPS);
  const trip: Trip = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  await saveAll([...(trips ?? []), trip]);
  return trip;
}

async function remove(id: string): Promise<void> {
  const trips = await storageService.getItem<Trip[]>(StorageKeys.TRIPS);
  await saveAll((trips ?? []).filter((t) => t.id !== id));
}

export const tripRepository = {
  getAll,
  create,
  remove,
};