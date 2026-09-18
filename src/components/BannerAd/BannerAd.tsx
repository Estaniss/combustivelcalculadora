import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { appConfig, adsConfig } from '@config/app.config';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';

/**
 * Único ponto do app que importa o componente nativo de banner do AdMob.
 * Retorna `null` automaticamente se os anúncios/banner estiverem desabilitados
 * na configuração, então pode ser usado incondicionalmente nas telas.
 */
export function BannerAd() {
  const [failed, setFailed] = useState(false);

  if (!appConfig.enableAds || !appConfig.enableBanner || failed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GoogleBannerAd
        unitId={adsConfig.bannerId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => analyticsService.trackEvent(AnalyticsEvents.AD_BANNER_SHOWN)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
});
