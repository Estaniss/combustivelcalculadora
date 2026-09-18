import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { appConfig, adsConfig } from '@config/app.config';
import { storageService, StorageKeys } from '@services/storage/storageService';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';

/**
 * Camada de abstração sobre o SDK do AdMob.
 *
 * NENHUM componente de tela deve importar 'react-native-google-mobile-ads'
 * diretamente (exceto o componente <BannerAd> em src/components/BannerAd,
 * que é a única exceção intencional pois precisa renderizar o banner nativo).
 * Toda a lógica de interstitial/rewarded, frequência e habilitação passa
 * por aqui.
 */

let interstitial: InterstitialAd | null = null;
let rewarded: RewardedAd | null = null;
let sdkInitialized = false;

export function isAdsEnabled(): boolean {
  return appConfig.enableAds;
}

export async function initializeAds(): Promise<void> {
  if (!isAdsEnabled() || sdkInitialized) return;
  try {
    await mobileAds().initialize();
    sdkInitialized = true;

    if (appConfig.enableInterstitial) {
      interstitial = InterstitialAd.createForAdRequest(adsConfig.interstitialId);
      interstitial.load();
    }
    if (appConfig.enableRewarded) {
      rewarded = RewardedAd.createForAdRequest(adsConfig.rewardedId);
      rewarded.load();
    }
  } catch (error) {
    console.warn('[adsService] falha ao inicializar AdMob', error);
  }
}

async function canShowInterstitial(): Promise<boolean> {
  if (!isAdsEnabled() || !appConfig.enableInterstitial) return false;
  const lastShownAt = await storageService.getItem<number>(StorageKeys.LAST_INTERSTITIAL_SHOWN_AT);
  if (!lastShownAt) return true;
  return Date.now() - lastShownAt >= appConfig.minimumIntervalBetweenInterstitials;
}

/**
 * Exibe um interstitial respeitando o intervalo mínimo configurado.
 * Retorna `true` se o anúncio foi exibido, `false` caso contrário
 * (desabilitado, ainda carregando, ou dentro do intervalo mínimo).
 *
 * Não chame isto imediatamente após abrir o app, durante uma ação
 * importante do usuário, ou antes dele ver o resultado de uma ação —
 * escolha o ponto de chamada com cuidado (ex: depois de o resultado
 * já estar visível na tela por alguns segundos).
 */
export async function showInterstitial(): Promise<boolean> {
  if (!interstitial) return false;
  const allowed = await canShowInterstitial();
  if (!allowed) return false;

  return new Promise((resolve) => {
    const unsubscribeLoaded = interstitial!.addAdEventListener(AdEventType.LOADED, () => {
      interstitial!.show();
    });
    const unsubscribeClosed = interstitial!.addAdEventListener(AdEventType.CLOSED, () => {
      storageService.setItem(StorageKeys.LAST_INTERSTITIAL_SHOWN_AT, Date.now());
      analyticsService.trackEvent(AnalyticsEvents.AD_INTERSTITIAL_SHOWN);
      // Pré-carrega o próximo interstitial
      interstitial = InterstitialAd.createForAdRequest(adsConfig.interstitialId);
      interstitial.load();
      unsubscribeLoaded();
      unsubscribeClosed();
      resolve(true);
    });
    const unsubscribeError = interstitial!.addAdEventListener(AdEventType.ERROR, () => {
      analyticsService.trackEvent(AnalyticsEvents.AD_INTERSTITIAL_FAILED);
      unsubscribeLoaded();
      unsubscribeError();
      resolve(false);
    });

    // Se já estiver carregado, apenas exibe.
    interstitial!.show().catch(() => resolve(false));
  });
}

/**
 * Exibe um rewarded ad. Resolve com `true` somente se o usuário assistiu
 * até o fim e ganhou a recompensa.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!rewarded || !appConfig.enableRewarded) return false;

  return new Promise((resolve) => {
    let earned = false;

    const unsubscribeEarned = rewarded!.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
        analyticsService.trackEvent(AnalyticsEvents.AD_REWARDED_EARNED);
      },
    );
    const unsubscribeLoaded = rewarded!.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewarded!.show();
      analyticsService.trackEvent(AnalyticsEvents.AD_REWARDED_SHOWN);
    });

    rewarded!.load();

    setTimeout(() => {
      unsubscribeEarned();
      unsubscribeLoaded();
      // Prepara o próximo rewarded
      rewarded = RewardedAd.createForAdRequest(adsConfig.rewardedId);
      resolve(earned);
    }, 15_000);
  });
}
