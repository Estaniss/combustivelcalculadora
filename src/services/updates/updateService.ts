import { updatesConfig } from '@config/updates.config';
import { evaluateUpdate, parseManifest, UpdateStatus, VersionManifest } from './versionUtils';

export type UpdateCheckResult =
  { status: UpdateStatus; latestVersion: string; message?: string } | { status: 'unavailable' };

type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal; headers?: Record<string, string> },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export interface CheckDependencies {
  fetchImpl?: FetchLike;
  url?: string;
  timeoutMs?: number;
}

export async function fetchVersionManifest({
  fetchImpl = fetch as unknown as FetchLike,
  url = updatesConfig.manifestUrl,
  timeoutMs = updatesConfig.timeoutMs,
}: CheckDependencies = {}): Promise<VersionManifest | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return null;
    return parseManifest(await response.json());
  } catch {
    return null; // offline, timeout, JSON inválido… nunca derruba o app
  } finally {
    clearTimeout(timer);
  }
}

/** Nunca lança erro: se não der pra checar, devolve { status: 'unavailable' }. */
export async function checkForUpdate(
  currentVersion: string,
  deps: CheckDependencies = {},
): Promise<UpdateCheckResult> {
  const manifest = await fetchVersionManifest(deps);
  if (!manifest) return { status: 'unavailable' };

  return {
    status: evaluateUpdate(currentVersion, manifest),
    latestVersion: manifest.latestVersion,
    message: manifest.message,
  };
}
