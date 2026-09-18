import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@theme/index';
import { AppNavigator } from '@/navigation/AppNavigator';
import { initializeAds } from '@services/ads/adsService';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignora se já estiver escondida */
});

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([
        initializeAds(),
        analyticsService
          .initialize()
          .then(() => analyticsService.trackEvent(AnalyticsEvents.APP_OPENED)),
      ]);
      setIsReady(true);
    })();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
