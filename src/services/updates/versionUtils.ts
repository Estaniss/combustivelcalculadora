export interface VersionManifest {
  latestVersion: string;
  /** Versões abaixo desta são obrigadas a atualizar. */
  minSupportedVersion?: string;
  message?: string;
}

export type UpdateStatus = 'up-to-date' | 'optional' | 'required';

const MAX_MESSAGE_LENGTH = 280;

/** "1.2.3", "v1.2" ou "1.2.3-beta" -> [1,2,3]. Retorna null se inválida. */
export function parseVersion(version: string): number[] | null {
  const match = /^v?(\d+(?:\.\d+){0,3})/.exec(version.trim());
  if (!match || !match[1]) return null;
  return match[1].split('.').map(Number);
}

/**
 * -1 se a < b, 0 se iguais, 1 se a > b.
 * Se alguma versão for inválida devolve 0: na dúvida, não incomoda o usuário.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = parseVersion(a);
  const partsB = parseVersion(b);
  if (!partsA || !partsB) return 0;

  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}

/** Valida o JSON remoto. Qualquer coisa fora do formato esperado vira null. */
export function parseManifest(json: unknown): VersionManifest | null {
  if (typeof json !== 'object' || json === null) return null;
  const data = json as Record<string, unknown>;

  if (typeof data.latestVersion !== 'string' || !parseVersion(data.latestVersion)) return null;

  const manifest: VersionManifest = { latestVersion: data.latestVersion };
  if (typeof data.minSupportedVersion === 'string' && parseVersion(data.minSupportedVersion)) {
    manifest.minSupportedVersion = data.minSupportedVersion;
  }
  if (typeof data.message === 'string' && data.message.trim() !== '') {
    manifest.message = data.message.trim().slice(0, MAX_MESSAGE_LENGTH);
  }
  return manifest;
}

export function evaluateUpdate(currentVersion: string, manifest: VersionManifest): UpdateStatus {
  if (
    manifest.minSupportedVersion &&
    compareVersions(currentVersion, manifest.minSupportedVersion) < 0
  ) {
    return 'required';
  }
  if (compareVersions(currentVersion, manifest.latestVersion) < 0) return 'optional';
  return 'up-to-date';
}
