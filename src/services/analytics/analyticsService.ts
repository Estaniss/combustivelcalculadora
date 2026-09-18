import analytics from '@react-native-firebase/analytics';
import { appConfig } from '@config/app.config';
import { storageService, StorageKeys } from '@services/storage/storageService';

/**
 * Camada de abstração sobre o provedor de analytics.
 *
 * Nenhuma tela ou componente deve importar '@react-native-firebase/analytics'
 * diretamente — sempre usar `trackEvent` / `trackScreenView` daqui. Isso
 * permite trocar o Firebase por outra ferramenta (ex: Amplitude, PostHog)
 * alterando apenas este arquivo.
 */

/** Nomes de eventos padronizados usados pelo app inteiro. */
export const AnalyticsEvents = {
  APP_OPENED: 'app_opened',
  SCREEN_VIEW: 'screen_view',
  CALCULATOR_USED: 'calculator_used',
  RESULT_GENERATED: 'result_generated',
  AD_BANNER_SHOWN: 'ad_banner_shown',
  AD_INTERSTITIAL_SHOWN: 'ad_interstitial_shown',
  AD_INTERSTITIAL_FAILED: 'ad_interstitial_failed',
  AD_REWARDED_SHOWN: 'ad_rewarded_shown',
  AD_REWARDED_EARNED: 'ad_rewarded_earned',
  SETTINGS_THEME_CHANGED: 'settings_theme_changed',

  // --- Eventos específicos do app Combustível ---
  VEHICLE_CREATED: 'vehicle_created',
  VEHICLE_SELECTED: 'vehicle_selected',
  TRIP_CALCULATED: 'trip_calculated',
  FUEL_COMPARISON_USED: 'fuel_comparison_used',
  CONSUMPTION_CALCULATED: 'consumption_calculated',
  REFUELING_CREATED: 'refueling_created',
  STATISTICS_VIEWED: 'statistics_viewed',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

let initialized = false;

async function isEnabled(): Promise<boolean> {
  if (!appConfig.enableAnalytics) return false;
  const consent = await storageService.getItem<boolean>(StorageKeys.ANALYTICS_CONSENT);
  // Por padrão (antes de o usuário decidir), consideramos habilitado apenas
  // se não houver requisito de consentimento explícito configurado.
  return consent !== false;
}

export const analyticsService = {
  async initialize(): Promise<void> {
    if (initialized || !appConfig.enableAnalytics) return;
    try {
      const enabled = await isEnabled();
      await analytics().setAnalyticsCollectionEnabled(enabled);
      initialized = true;
    } catch (error) {
      console.warn('[analyticsService] falha ao inicializar', error);
    }
  },

  async setConsent(granted: boolean): Promise<void> {
    await storageService.setItem(StorageKeys.ANALYTICS_CONSENT, granted);
    try {
      await analytics().setAnalyticsCollectionEnabled(granted && appConfig.enableAnalytics);
    } catch (error) {
      console.warn('[analyticsService] falha ao atualizar consentimento', error);
    }
  },

  async trackEvent(name: AnalyticsEventName, params?: Record<string, unknown>): Promise<void> {
    if (!(await isEnabled())) return;
    try {
      await analytics().logEvent(name, params);
    } catch (error) {
      console.warn(`[analyticsService] falha ao registrar evento "${name}"`, error);
    }
  },

  async trackScreenView(screenName: string): Promise<void> {
    if (!(await isEnabled())) return;
    try {
      await analytics().logScreenView({ screen_name: screenName, screen_class: screenName });
    } catch (error) {
      console.warn(`[analyticsService] falha ao registrar tela "${screenName}"`, error);
    }
  },
};
