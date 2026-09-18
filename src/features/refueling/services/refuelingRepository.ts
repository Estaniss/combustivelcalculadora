import { storageService, StorageKeys } from '@services/storage/storageService';
import { Refueling, NewRefuelingInput } from '@/domain/refueling';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function getAll(): Promise<Refueling[]> {
  const items = await storageService.getItem<Refueling[]>(StorageKeys.REFUELINGS);
  return items ?? [];
}

async function saveAll(items: Refueling[]): Promise<void> {
  await storageService.setItem(StorageKeys.REFUELINGS, items);
}

async function getByVehicle(vehicleId: string): Promise<Refueling[]> {
  const items = await getAll();
  return items
    .filter((r) => r.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function create(input: NewRefuelingInput): Promise<Refueling> {
  const items = await getAll();
  const refueling: Refueling = {
    ...input,
    id: generateId(),
    totalCost: input.liters * input.pricePerLiter,
    createdAt: new Date().toISOString(),
  };
  await saveAll([...items, refueling]);
  return refueling;
}

async function update(id: string, changes: Partial<NewRefuelingInput>): Promise<Refueling | null> {
  const items = await getAll();
  const index = items.findIndex((r) => r.id === id);
  const existing = items[index];
  if (index === -1 || !existing) return null;

  const merged = { ...existing, ...changes };
  const updated: Refueling = {
    ...merged,
    totalCost: merged.liters * merged.pricePerLiter,
  };
  const next = [...items];
  next[index] = updated;
  await saveAll(next);
  return updated;
}

async function remove(id: string): Promise<void> {
  const items = await getAll();
  await saveAll(items.filter((r) => r.id !== id));
}

export const refuelingRepository = {
  getAll,
  getByVehicle,
  create,
  update,
  remove,
};
