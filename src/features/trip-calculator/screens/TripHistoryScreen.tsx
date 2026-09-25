import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { EmptyState } from '@components/EmptyState';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { tripRepository } from '../services/tripRepository';
import { Trip } from '@/domain/trip';
import { formatCurrency, formatDate, formatKm } from '@utils/format';

export function TripHistoryScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Trip[]>([]);
  useAnalyticsScreenView('TripHistory');

  const load = useCallback(() => {
    tripRepository.getAll().then(setItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async (id: string) => {
    await tripRepository.remove(id);
    load();
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Histórico de viagens" showBack />

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma viagem calculada ainda"
          description={'Os cálculos que você fizer em "Quanto vou gastar?" aparecem aqui.'}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {formatDate(item.createdAt)}
                </Text>
                {item.roundTrip && (
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Ida e volta
                  </Text>
                )}
              </View>
              <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: 4 }]}>
                {formatKm(item.totalDistanceKm)} · {item.requiredLiters.toFixed(1)} L
              </Text>
              <Text
                style={[
                  theme.typography.subtitle,
                  { color: theme.colors.primary, fontWeight: '700', marginTop: 4 },
                ]}
              >
                {formatCurrency(item.totalCost)}
              </Text>
              {item.costPerPerson !== undefined && (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  {formatCurrency(item.costPerPerson)} por pessoa ({item.numberOfPeople})
                </Text>
              )}
              <View style={{ marginTop: theme.spacing.sm }}>
                <Button label="Excluir" variant="outline" onPress={() => handleDelete(item.id)} />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
