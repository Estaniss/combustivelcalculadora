import { Icon } from '@components/Icon';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '@theme/index';
import { Header } from '@components/Header';
import { Input } from '@components/Input';
import { MoneyInput } from '@components/MoneyInput';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { FadeInView } from '@components/FadeInView';
import { BannerAd } from '@components/BannerAd';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { useAds } from '@hooks/useAds';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { vehicleRepository } from '@features/vehicles/services/vehicleRepository';
import { getVehicleConsumption } from '@/domain/vehicle';
import { compareFuelTypes, FuelComparisonResult } from '../services/fuelComparison';
import {
  buildComparisonExplanation,
  ComparisonExplanation,
  estimateTankSavings,
} from '../services/comparisonInsights';
import { comparisonRepository } from '../services/comparisonRepository';
import { ComparisonBars } from '../components/ComparisonBars';
import { INPUT_LIMITS, validateNumber } from '@utils/validation';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FuelComparison'>;

type FieldKey =
  'gasolinePrice' | 'gasolineConsumption' | 'ethanolPrice' | 'ethanolConsumption' | 'tank';
type FieldErrors = Partial<Record<FieldKey, string>>;

function validatePrice(value: number, label: string): string | undefined {
  if (!value || value <= 0) return `Informe o preço ${label}.`;
  if (value > INPUT_LIMITS.pricePerLiter) return `O preço ${label} parece alto demais.`;
  return undefined;
}

export function FuelComparisonScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { showInterstitial } = useAds();
  useAnalyticsScreenView('FuelComparison');

  const [gasolinePrice, setGasolinePrice] = useState(0);
  const [gasolineConsumption, setGasolineConsumption] = useState('');
  const [ethanolPrice, setEthanolPrice] = useState(0);
  const [ethanolConsumption, setEthanolConsumption] = useState('');
  const [tankCapacity, setTankCapacity] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<FuelComparisonResult | null>(null);
  const [explanation, setExplanation] = useState<ComparisonExplanation | null>(null);
  const [vehicleName, setVehicleName] = useState<string | null>(null);

  // Preenche consumo e tanque com os dados do veículo selecionado (se houver).
  useEffect(() => {
    vehicleRepository.getSelected().then((vehicle) => {
      if (!vehicle) return;
      const gasoline = getVehicleConsumption(vehicle, 'gasoline');
      const ethanol = getVehicleConsumption(vehicle, 'ethanol');
      if (gasoline) setGasolineConsumption(String(gasoline).replace('.', ','));
      if (ethanol) setEthanolConsumption(String(ethanol).replace('.', ','));
      if (vehicle.tankCapacityLiters) {
        setTankCapacity(String(vehicle.tankCapacityLiters).replace('.', ','));
      }
      setVehicleName(vehicle.name);
    });
  }, []);

  const handleCompare = () => {
    const nextErrors: FieldErrors = {};

    nextErrors.gasolinePrice = validatePrice(gasolinePrice, 'da gasolina');
    nextErrors.ethanolPrice = validatePrice(ethanolPrice, 'do etanol');

    const gasolineCheck = validateNumber(gasolineConsumption, 'o consumo com gasolina', {
      max: INPUT_LIMITS.consumptionKmPerLiter,
    });
    const ethanolCheck = validateNumber(ethanolConsumption, 'o consumo com etanol', {
      max: INPUT_LIMITS.consumptionKmPerLiter,
    });
    if (!gasolineCheck.ok) nextErrors.gasolineConsumption = gasolineCheck.error;
    if (!ethanolCheck.ok) nextErrors.ethanolConsumption = ethanolCheck.error;

    // Tanque é opcional: só valida se foi preenchido.
    const tankCheck =
      tankCapacity.trim() === ''
        ? null
        : validateNumber(tankCapacity, 'a capacidade do tanque', { max: INPUT_LIMITS.tankLiters });
    if (tankCheck && !tankCheck.ok) nextErrors.tank = tankCheck.error;

    const hasError = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    if (hasError || !gasolineCheck.ok || !ethanolCheck.ok) {
      setResult(null);
      setExplanation(null);
      return;
    }

    const calculated = compareFuelTypes(
      { pricePerLiter: gasolinePrice, consumptionKmPerLiter: gasolineCheck.value },
      { pricePerLiter: ethanolPrice, consumptionKmPerLiter: ethanolCheck.value },
    );
    const tankSavings =
      tankCheck && tankCheck.ok
        ? estimateTankSavings({
            comparison: calculated,
            tankLiters: tankCheck.value,
            gasolineConsumption: gasolineCheck.value,
            ethanolConsumption: ethanolCheck.value,
          })
        : null;

    setResult(calculated);
    setExplanation(buildComparisonExplanation(calculated, tankSavings));

    comparisonRepository.create({
      gasolinePrice,
      gasolineConsumption: gasolineCheck.value,
      ethanolPrice,
      ethanolConsumption: ethanolCheck.value,
      cheaperOption: calculated.cheaperOption,
      savingsPer100Km: calculated.savingsPer100Km,
      priceRatio: calculated.priceRatio,
    });
    analyticsService.trackEvent(AnalyticsEvents.FUEL_COMPARISON_USED);
    setTimeout(() => showInterstitial(), 1200);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Gasolina x Etanol"
        showBack
        rightIcon={<Icon name="history" size={22} />}
        rightLabel="Últimas comparações"
        onRightPress={() => navigation.navigate('ComparisonHistory')}
      />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.xs }}
        keyboardShouldPersistTaps="handled"
      >
        {vehicleName ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Usando os consumos de: {vehicleName}
          </Text>
        ) : null}

        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          GASOLINA
        </Text>
        <MoneyInput
          label="Preço por litro"
          value={gasolinePrice}
          onChangeValue={setGasolinePrice}
          error={errors.gasolinePrice}
        />
        <Input
          label="Consumo (km/L)"
          keyboard="decimal"
          value={gasolineConsumption}
          onChangeText={setGasolineConsumption}
          placeholder="Ex: 12"
          error={errors.gasolineConsumption}
        />

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
          ]}
        >
          ETANOL
        </Text>
        <MoneyInput
          label="Preço por litro"
          value={ethanolPrice}
          onChangeValue={setEthanolPrice}
          error={errors.ethanolPrice}
        />
        <Input
          label="Consumo (km/L)"
          keyboard="decimal"
          value={ethanolConsumption}
          onChangeText={setEthanolConsumption}
          placeholder="Ex: 8,5"
          error={errors.ethanolConsumption}
        />

        <Input
          label="Capacidade do tanque em litros (opcional, mostra a economia por tanque)"
          keyboard="decimal"
          value={tankCapacity}
          onChangeText={setTankCapacity}
          placeholder="Ex: 50"
          error={errors.tank}
        />

        <View style={{ marginTop: theme.spacing.md }}>
          <Button label="Comparar" onPress={handleCompare} />
        </View>

        {result && explanation ? (
          <FadeInView accessibilityLiveRegion="polite">
            <Card style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
              <Text
                accessibilityRole="header"
                style={[
                  theme.typography.subtitle,
                  { color: theme.colors.text, fontFamily: fonts.semibold },
                ]}
              >
                {explanation.headline}
              </Text>

              <ComparisonBars
                gasolineCostPer100Km={result.gasolineCostPer100Km}
                ethanolCostPer100Km={result.ethanolCostPer100Km}
                winner={result.cheaperOption}
              />

              <View style={{ gap: 4 }}>
                {explanation.reasons.map((line) => (
                  <Text key={line} style={[theme.typography.body, { color: theme.colors.text }]}>
                    {line}
                  </Text>
                ))}
              </View>

              {explanation.savings.length > 0 && (
                <View style={{ gap: 4 }}>
                  {explanation.savings.map((line) => (
                    <Text
                      key={line}
                      style={[
                        theme.typography.body,
                        { color: theme.colors.primary, fontFamily: fonts.semibold },
                      ]}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </Card>
          </FadeInView>
        ) : null}
      </ScrollView>
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
