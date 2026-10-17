import { useCallback, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { appConfig, getPlayStoreUrl } from '@config/app.config';
import { updatesConfig } from '@config/updates.config';
import { storageService, StorageKeys } from '@services/storage/storageService';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { checkForUpdate } from '@services/updates/updateService';
import { Linking } from 'react-native';

export interface UpdatePrompt {
  required: boolean;
  latestVersion: string;
  message?: string;
}

/** Versão instalada (a mesma do app.json), com fallback para a do app.config.ts. */
function getInstalledVersion(): string {
  return Constants.expoConfig?.version ?? appConfig.appVersion;
}

/**
 * Verifica uma vez por abertura se há versão nova na loja.
 * - Atualização opcional: aparece uma vez por versão (se o usuário dispensar,
 *   não insiste até sair uma versão ainda mais nova).
 * - Atualização obrigatória (abaixo de minSupportedVersion): sempre aparece.
 */
export function useUpdateCheck() {
  const [prompt, setPrompt] = useState<UpdatePrompt | null>(null);

  useEffect(() => {
    if (!updatesConfig.enabled) return;
    let cancelled = false;

    (async () => {
      const result = await checkForUpdate(getInstalledVersion());
      if (cancelled || result.status === 'unavailable' || result.status === 'up-to-date') return;

      if (result.status === 'optional') {
        const dismissed = await storageService.getItem<string>(
          StorageKeys.UPDATE_DISMISSED_VERSION,
        );
        if (dismissed === result.latestVersion) return;
      }

      if (cancelled) return;
      setPrompt({
        required: result.status === 'required',
        latestVersion: result.latestVersion,
        message: result.message,
      });
      analyticsService.trackEvent(AnalyticsEvents.UPDATE_PROMPT_SHOWN, {
        required: result.status === 'required',
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const accept = useCallback(() => {
    analyticsService.trackEvent(AnalyticsEvents.UPDATE_ACCEPTED);
    Linking.openURL(getPlayStoreUrl());
  }, []);

  const dismiss = useCallback(async () => {
    if (!prompt || prompt.required) return;
    await storageService.setItem(StorageKeys.UPDATE_DISMISSED_VERSION, prompt.latestVersion);
    analyticsService.trackEvent(AnalyticsEvents.UPDATE_DISMISSED);
    setPrompt(null);
  }, [prompt]);

  return { prompt, accept, dismiss };
}
