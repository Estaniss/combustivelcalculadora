import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { BannerAd } from '@components/BannerAd';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { useAds } from '@hooks/useAds';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { compareFuelTypes, FuelComparisonResult } from '../services/fuelComparison';
import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';
import { formatCurrency, formatNumber, parseLocaleNumber } from '@utils/format';

export function FuelComparisonScreen() {
  const theme = useTheme();
  const { showInterstitial } = useAds();
  useAnalyticsScreenView('FuelComparison');

  const [gasolinePrice, setGasolinePrice] = useState('');
  const [gasolineConsumption, setGasolineConsumption] = useState('');
  const [ethanolPrice, setEthanolPrice] = useState('');
  const [ethanolConsumption, setEthanolConsumption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FuelComparisonResult | null>(null);

  const handleCompare = () => {
    setError(null);
    try {
      const calculated = compareFuelTypes(
        {
          pricePerLiter: parseLocaleNumber(gasolinePrice),
          consumptionKmPerLiter: parseLocaleNumber(gasolineConsumption),
        },
        {
          pricePerLiter: parseLocaleNumber(ethanolPrice),
          consumptionKmPerLiter: parseLocaleNumber(ethanolConsumption),
        },
      );
      setResult(calculated);
      analyticsService.trackEvent(AnalyticsEvents.FUEL_COMPARISON_USED);
      setTimeout(() => showInterstitial(), 1200);
    } catch (e) {
      setResult(null);
      setError(e instanceof InvalidInputError ? e.message : 'Não foi possível calcular.');
    }
  };

  const resultLabel =
    result?.cheaperOption === 'gasoline'
      ? '⛽ Gasolina é mais econômica'
      : result?.cheaperOption === 'ethanol'
        ? '⛽ Etanol é mais econômico'
        : '⚖️ Empate entre as opções';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Gasolina x Etanol" showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          GASOLINA
        </Text>
        <Input
          label="Preço (R$/L)"
          keyboard="decimal"
          value={gasolinePrice}
          onChangeText={setGasolinePrice}
          placeholder="Ex: 6,20"
        />
        <Input
          label="Consumo (km/L)"
          keyboard="decimal"
          value={gasolineConsumption}
          onChangeText={setGasolineConsumption}
          placeholder="Ex: 12"
        />

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
          ]}
        >
          ETANOL
        </Text>
        <Input
          label="Preço (R$/L)"
          keyboard="decimal"
          value={ethanolPrice}
          onChangeText={setEthanolPrice}
          placeholder="Ex: 4,20"
        />
        <Input
          label="Consumo (km/L)"
          keyboard="decimal"
          value={ethanolConsumption}
          onChangeText={setEthanolConsumption}
          placeholder="Ex: 8,5"
        />

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>{error}</Text>
        ) : null}

        <View style={{ marginTop: theme.spacing.md }}>
          <Button label="Comparar" onPress={handleCompare} />
        </View>

        {result ? (
          <Card style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
            <Text
              style={[theme.typography.subtitle, { color: theme.colors.text, fontWeight: '700' }]}
            >
              {resultLabel}
            </Text>
            {result.cheaperOption !== 'tie' && (
              <Text
                style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}
              >
                Economia estimada: {formatCurrency(result.savingsPer100Km)} a cada 100 km.
              </Text>
            )}
            <View
              style={{ flexDirection: 'row', gap: theme.spacing.lg, marginTop: theme.spacing.md }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Gasolina
                </Text>
                <Text
                  style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}
                >
                  {formatCurrency(result.gasolineCostPerKm)}/km
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Etanol
                </Text>
                <Text
                  style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}
                >
                  {formatCurrency(result.ethanolCostPerKm)}/km
                </Text>
              </View>
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
              ]}
            >
              Diferença de {formatNumber(result.percentageDifference)}% entre as opções
            </Text>
          </Card>
        ) : null}
      </ScrollView>
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
