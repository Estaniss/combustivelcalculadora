import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { ResultCard } from '@components/ResultCard';
import { EmptyState } from '@components/EmptyState';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { vehicleRepository } from '@features/vehicles/services/vehicleRepository';
import { refuelingRepository } from '@features/refueling/services/refuelingRepository';
import { calculateMonthStatistics, MonthStatistics } from '../services/statisticsCalculator';
import { formatCurrency, formatKm, formatKmPerLiter } from '@utils/format';

export function StatisticsScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState<MonthStatistics | null>(null);
  useAnalyticsScreenView('Statistics');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const vehicle = await vehicleRepository.getSelected();
        if (!vehicle) {
          setStats(null);
          return;
        }
        const refuelings = await refuelingRepository.getByVehicle(vehicle.id);
        setStats(calculateMonthStatistics(refuelings));
        analyticsService.trackEvent(AnalyticsEvents.STATISTICS_VIEWED);
      })();
    }, []),
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Estatísticas" showBack />
      {!stats || stats.refuelingCount === 0 ? (
        <EmptyState
          title="Sem dados suficientes"
          description="Registre alguns abastecimentos para ver suas estatísticas do mês."
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            ESTE MÊS
          </Text>
          <ResultCard label="Gasto" value={formatCurrency(stats.totalSpent)} />
          <ResultCard label="Litros" value={`${stats.totalLiters.toFixed(1)} L`} />
          {stats.estimatedDistanceKm > 0 && (
            <ResultCard label="Distância estimada" value={formatKm(stats.estimatedDistanceKm)} />
          )}
          {stats.averageConsumption !== null && (
            <ResultCard label="Consumo médio" value={formatKmPerLiter(stats.averageConsumption)} />
          )}
          {stats.averageCostPerKm !== null && (
            <ResultCard
              label="Custo médio"
              value={`${formatCurrency(stats.averageCostPerKm)}/km`}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
