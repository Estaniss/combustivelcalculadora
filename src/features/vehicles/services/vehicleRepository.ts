import { storageService, StorageKeys } from '@services/storage/storageService';
import { Vehicle, NewVehicleInput } from '@/domain/vehicle';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function getAll(): Promise<Vehicle[]> {
  const vehicles = await storageService.getItem<Vehicle[]>(StorageKeys.VEHICLES);
  return vehicles ?? [];
}

async function saveAll(vehicles: Vehicle[]): Promise<void> {
  await storageService.setItem(StorageKeys.VEHICLES, vehicles);
}

async function create(input: NewVehicleInput): Promise<Vehicle> {
  const vehicles = await getAll();
  const now = new Date().toISOString();
  const vehicle: Vehicle = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const updated = [...vehicles, vehicle];
  await saveAll(updated);

  const selectedId = await storageService.getItem<string>(StorageKeys.SELECTED_VEHICLE_ID);
  if (!selectedId) {
    await storageService.setItem(StorageKeys.SELECTED_VEHICLE_ID, vehicle.id);
  }

  return vehicle;
}

async function update(id: string, changes: Partial<NewVehicleInput>): Promise<Vehicle | null> {
  const vehicles = await getAll();
  const index = vehicles.findIndex((v) => v.id === id);
  const existing = vehicles[index];
  if (index === -1 || !existing) return null;

  const updatedVehicle: Vehicle = {
    ...existing,
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  const updated = [...vehicles];
  updated[index] = updatedVehicle;
  await saveAll(updated);
  return updatedVehicle;
}

async function remove(id: string): Promise<void> {
  const vehicles = await getAll();
  const remaining = vehicles.filter((v) => v.id !== id);
  await saveAll(remaining);

  const selectedId = await storageService.getItem<string>(StorageKeys.SELECTED_VEHICLE_ID);
  if (selectedId === id) {
    await storageService.setItem(StorageKeys.SELECTED_VEHICLE_ID, remaining[0]?.id ?? null);
  }
}

async function getSelected(): Promise<Vehicle | null> {
  const selectedId = await storageService.getItem<string>(StorageKeys.SELECTED_VEHICLE_ID);
  if (!selectedId) return null;
  const vehicles = await getAll();
  return vehicles.find((v) => v.id === selectedId) ?? null;
}

async function selectVehicle(id: string): Promise<void> {
  await storageService.setItem(StorageKeys.SELECTED_VEHICLE_ID, id);
}

export const vehicleRepository = {
  getAll,
  create,
  update,
  remove,
  getSelected,
  selectVehicle,
};
