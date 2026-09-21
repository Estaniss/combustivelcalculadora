import { TestIds } from 'react-native-google-mobile-ads';
import { IS_PROD } from './env';

export interface AdsConfig {
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
}

const productionAdsConfig: AdsConfig = {
  bannerId: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '',
  interstitialId: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '',
  rewardedId: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? '',
};

const testAdsConfig: AdsConfig = {
  bannerId: TestIds.BANNER,
  interstitialId: TestIds.INTERSTITIAL,
  rewardedId: TestIds.REWARDED,
};

export const adsConfig = IS_PROD
  ? productionAdsConfig
  : testAdsConfig;