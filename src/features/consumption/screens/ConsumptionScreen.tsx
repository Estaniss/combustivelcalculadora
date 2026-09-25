import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { ResultCard } from '@components/ResultCard';
import { BannerAd } from '@components/BannerAd';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { calculateAverageConsumption, ConsumptionResult } from '../services/consumptionCalculator';
import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';
import { formatCurrency, formatKm, formatKmPerLiter, parseLocaleNumber } from '@utils/format';
import { MoneyInput } from '@/components/MoneyInput';

export function ConsumptionScreen() {
  const theme = useTheme();
  useAnalyticsScreenView('Consumption');

  const [previousOdometer, setPreviousOdometer] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [price, setPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConsumptionResult | null>(null);

  const handleCalculate = () => {
    setError(null);
    try {
      const calculated = calculateAverageConsumption({
        previousOdometer: parseLocaleNumber(previousOdometer),
        currentOdometer: parseLocaleNumber(currentOdometer),
        liters: parseLocaleNumber(liters),
        pricePerLiter: price,
      });
      setResult(calculated);
      analyticsService.trackEvent(AnalyticsEvents.CONSUMPTION_CALCULATED);
    } catch (e) {
      setResult(null);
      setError(e instanceof InvalidInputError ? e.message : 'Não foi possível calcular.');
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Meu consumo" showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Odômetro anterior (km)"
          keyboard="decimal"
          value={previousOdometer}
          onChangeText={setPreviousOdometer}
          placeholder="Ex: 50000"
        />
        <Input
          label="Odômetro atual (km)"
          keyboard="decimal"
          value={currentOdometer}
          onChangeText={setCurrentOdometer}
          placeholder="Ex: 50450"
        />
        <Input
          label="Litros abastecidos"
          keyboard="decimal"
          value={liters}
          onChangeText={setLiters}
          placeholder="Ex: 37,5"
        />
        <MoneyInput label="Preço por litro" value={price} onChangeValue={setPrice} />

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>{error}</Text>
        ) : null}

        <View style={{ marginTop: theme.spacing.md }}>
          <Button label="Calcular" onPress={handleCalculate} />
        </View>

        {result ? (
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <ResultCard label="Distância percorrida" value={formatKm(result.distanceKm)} />
            <ResultCard label="Consumo" value={formatKmPerLiter(result.consumptionKmPerLiter)} />
            {result.refuelingCost !== undefined && (
              <ResultCard
                label="Custo do abastecimento"
                value={formatCurrency(result.refuelingCost)}
              />
            )}
            {result.costPerKm !== undefined && (
              <ResultCard label="Custo por km" value={formatCurrency(result.costPerKm)} />
            )}
          </View>
        ) : null}
      </ScrollView>
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
