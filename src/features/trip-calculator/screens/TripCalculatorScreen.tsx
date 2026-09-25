import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { ResultCard } from '@components/ResultCard';
import { BannerAd } from '@components/BannerAd';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { useAds } from '@hooks/useAds';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { calculateTrip, InvalidInputError } from '../services/tripCalculator';
import { formatCurrency, formatKm, parseLocaleNumber } from '@utils/format';
import { MoneyInput } from '@/components/MoneyInput';
import { tripRepository } from '../services/tripRepository';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TripCalculator'>;

/**
 * "Quanto vou gastar?" — calculadora de custo de viagem.
 * Também cobre "Dividir viagem" (basta informar mais de 1 pessoa).
 */
export function TripCalculatorScreen() {
  const theme = useTheme();
  const { showInterstitial } = useAds();
  useAnalyticsScreenView('TripCalculator');

  const [distance, setDistance] = useState('');
  const [consumption, setConsumption] = useState('');
  const [price, setPrice] = useState(0);
  const [roundTrip, setRoundTrip] = useState(false);
  const [people, setPeople] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateTrip> | null>(null);

  const navigation = useNavigation<Nav>();

  const handleCalculate = () => {
    setError(null);
    try {
      const calculated = calculateTrip({
        distanceKm: parseLocaleNumber(distance),
        consumptionKmPerLiter: parseLocaleNumber(consumption),
        pricePerLiter: price,
        roundTrip,
        numberOfPeople: Number(people) || 1,
      });
      setResult(calculated);
      tripRepository.create({
        distanceKm: parseLocaleNumber(distance),
        consumptionKmPerLiter: parseLocaleNumber(consumption),
        pricePerLiter: price,
        roundTrip,
        numberOfPeople: Number(people) || 1,
        totalDistanceKm: calculated.totalDistanceKm,
        requiredLiters: calculated.requiredLiters,
        totalCost: calculated.totalCost,
        costPerKm: calculated.costPerKm,
        costPerPerson: calculated.costPerPerson,
      });
      analyticsService.trackEvent(AnalyticsEvents.TRIP_CALCULATED);
      setTimeout(() => showInterstitial(), 1200);
    } catch (e) {
      setResult(null);
      setError(e instanceof InvalidInputError ? e.message : 'Não foi possível calcular.');
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Quanto vou gastar?"
        showBack
        rightIcon={<Text style={{ fontSize: 20 }}>📜</Text>}
        onRightPress={() => navigation.navigate('TripHistory')}
      />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Distância (km)"
          keyboard="decimal"
          value={distance}
          onChangeText={setDistance}
          placeholder="Ex: 500"
        />
        <Input
          label="Consumo (km/L)"
          keyboard="decimal"
          value={consumption}
          onChangeText={setConsumption}
          placeholder="Ex: 12"
        />
        <MoneyInput label="Preço do combustível (R$/L)" value={price} onChangeValue={setPrice} />
        <View style={[styles.row, { marginTop: theme.spacing.sm }]}>
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>Ida e volta</Text>
          <Switch value={roundTrip} onValueChange={setRoundTrip} />
        </View>

        <Input
          label="Número de pessoas (para dividir a viagem)"
          keyboard="numeric"
          value={people}
          onChangeText={setPeople}
          placeholder="1"
        />

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>{error}</Text>
        ) : null}

        <View style={{ marginTop: theme.spacing.md }}>
          <Button label="Calcular" onPress={handleCalculate} />
        </View>

        {result ? (
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <ResultCard label="Distância total" value={formatKm(result.totalDistanceKm)} />
            <ResultCard
              label="Combustível necessário"
              value={`${result.requiredLiters.toFixed(2)} L`}
            />
            <ResultCard label="Custo estimado" value={formatCurrency(result.totalCost)} />
            <ResultCard label="Custo por km" value={formatCurrency(result.costPerKm)} />
            {result.costPerPerson !== undefined && (
              <ResultCard
                label={`Custo por pessoa (${people})`}
                value={formatCurrency(result.costPerPerson)}
              />
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
