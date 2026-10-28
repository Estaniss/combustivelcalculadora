import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@theme/index';
import { AppNavigator } from '@/navigation/AppNavigator';
import { UpdateGate } from '@components/UpdateModal';
import '@features/trip-mode/services/locationTask';
import { initializeAds } from '@services/ads/adsService';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  // Inter nos 3 pesos do DESIGN.md. Se falhar (raro), o app abre com a fonte do sistema.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const fontsSettled = fontsLoaded || fontError !== null;

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
    if (isReady && fontsSettled) {
      await SplashScreen.hideAsync();
    }
  }, [isReady, fontsSettled]);

  if (!isReady || !fontsSettled) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <UpdateGate />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
