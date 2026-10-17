import { storageService, StorageKeys } from '@services/storage/storageService';
import { ComparisonEntry, NewComparisonInput } from '@/domain/comparison';

/** Guarda só os cálculos mais recentes, para consulta rápida. */
export const MAX_COMPARISONS = 30;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readAll(): Promise<ComparisonEntry[]> {
  return (await storageService.getItem<ComparisonEntry[]>(StorageKeys.COMPARISONS)) ?? [];
}

async function getAll(): Promise<ComparisonEntry[]> {
  const entries = await readAll();
  return [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function create(input: NewComparisonInput): Promise<ComparisonEntry> {
  const entry: ComparisonEntry = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const entries = await readAll();
  const next = [...entries, entry]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-MAX_COMPARISONS);
  await storageService.setItem(StorageKeys.COMPARISONS, next);
  return entry;
}

async function remove(id: string): Promise<void> {
  const entries = await readAll();
  await storageService.setItem(
    StorageKeys.COMPARISONS,
    entries.filter((e) => e.id !== id),
  );
}

async function clear(): Promise<void> {
  await storageService.removeItem(StorageKeys.COMPARISONS);
}

export const comparisonRepository = { getAll, create, remove, clear };
