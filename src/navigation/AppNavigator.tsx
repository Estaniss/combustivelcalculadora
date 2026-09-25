import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '@screens/Home/HomeScreen';
import { AboutScreen } from '@screens/About/AboutScreen';
import { SettingsScreen } from '@screens/Settings/SettingsScreen';
import { OnboardingScreen } from '@screens/Onboarding';
import { VehiclesScreen } from '@features/vehicles/screens/VehiclesScreen';
import { VehicleFormScreen } from '@features/vehicles/screens/VehicleFormScreen';
import { TripCalculatorScreen } from '@features/trip-calculator/screens/TripCalculatorScreen';
import { FuelComparisonScreen } from '@features/fuel-comparison/screens/FuelComparisonScreen';
import { ConsumptionScreen } from '@features/consumption/screens/ConsumptionScreen';
import { RefuelingFormScreen } from '@features/refueling/screens/RefuelingFormScreen';
import { RefuelingHistoryScreen } from '@features/refueling/screens/RefuelingHistoryScreen';
import { StatisticsScreen } from '@features/statistics/screens/StatisticsScreen';
import { appConfig } from '@config/app.config';
import { storageService, StorageKeys } from '@services/storage/storageService';
import { Loading } from '@components/Loading';
import { TripHistoryScreen } from '@/features/trip-calculator/screens/TripHistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!appConfig.showOnboarding) {
      setShowOnboarding(false);
      return;
    }
    storageService.getItem<boolean>(StorageKeys.ONBOARDING_SEEN).then((seen) => {
      setShowOnboarding(!seen);
    });
  }, []);

  if (showOnboarding === null) {
    return <Loading />;
  }

  if (showOnboarding) {
    return (
      <NavigationContainer>
        <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        {appConfig.showAbout && <Stack.Screen name="About" component={AboutScreen} />}
        {appConfig.showSettings && <Stack.Screen name="Settings" component={SettingsScreen} />}
        <Stack.Screen name="Vehicles" component={VehiclesScreen} />
        <Stack.Screen name="VehicleForm" component={VehicleFormScreen} />
        <Stack.Screen name="TripCalculator" component={TripCalculatorScreen} />
        <Stack.Screen name="FuelComparison" component={FuelComparisonScreen} />
        <Stack.Screen name="Consumption" component={ConsumptionScreen} />
        <Stack.Screen name="RefuelingForm" component={RefuelingFormScreen} />
        <Stack.Screen name="RefuelingHistory" component={RefuelingHistoryScreen} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
        <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
