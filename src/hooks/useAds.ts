import { useCallback } from 'react';
import { isAdsEnabled, showInterstitial, showRewardedAd } from '@services/ads/adsService';

/**
 * Hook de conveniência para usar anúncios dentro de componentes de tela,
 * sem precisar importar o serviço de ads diretamente.
 */
export function useAds() {
  const triggerInterstitial = useCallback(() => showInterstitial(), []);
  const triggerRewarded = useCallback(() => showRewardedAd(), []);

  return {
    enabled: isAdsEnabled(),
    showInterstitial: triggerInterstitial,
    showRewardedAd: triggerRewarded,
  };
}
