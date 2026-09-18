/**
 * Configuração centralizada dos IDs de anúncio.
 *
 * IMPORTANTE:
 * - Nunca espalhe IDs de anúncio pelo código da aplicação.
 * - Em desenvolvimento, SEMPRE utilize os IDs de teste do Google (TestIds).
 * - Os IDs reais de produção devem vir de variáveis de ambiente
 *   (ver .env.example) e nunca devem ser commitados no repositório.
 */
import { TestIds } from 'react-native-google-mobile-ads';
import { IS_PROD } from './env';

export interface AdsConfig {
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
}

const productionAdsConfig: AdsConfig = {
  bannerId: process.env.ADMOB_BANNER_ID ?? '',
  interstitialId: process.env.ADMOB_INTERSTITIAL_ID ?? '',
  rewardedId: process.env.ADMOB_REWARDED_ID ?? '',
};

const testAdsConfig: AdsConfig = {
  bannerId: TestIds.BANNER,
  interstitialId: TestIds.INTERSTITIAL,
  rewardedId: TestIds.REWARDED,
};

/**
 * Em produção usa os IDs reais (via env vars). Em qualquer outro ambiente,
 * cai automaticamente para os IDs de teste — assim é impossível esquecer
 * de trocar os IDs e servir anúncio real durante o desenvolvimento.
 */
export const adsConfig: AdsConfig = IS_PROD ? productionAdsConfig : testAdsConfig;
