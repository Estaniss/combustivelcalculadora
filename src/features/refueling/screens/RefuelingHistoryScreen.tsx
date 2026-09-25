import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { EmptyState } from '@components/EmptyState';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { vehicleRepository } from '@features/vehicles/services/vehicleRepository';
import { refuelingRepository } from '../services/refuelingRepository';
import { Refueling } from '@/domain/refueling';
import { formatCurrency, formatDate, formatKmPerLiter } from '@utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RefuelingHistory'>;

const FUEL_LABELS: Record<Refueling['fuelType'], string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  diesel: 'Diesel',
};

export function RefuelingHistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Refueling[]>([]);
  useAnalyticsScreenView('RefuelingHistory');

  const load = useCallback(async () => {
    const vehicle = await vehicleRepository.getSelected();
    if (!vehicle) {
      setItems([]);
      return;
    }
    const history = await refuelingRepository.getByVehicle(vehicle.id);
    setItems(history);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async (id: string) => {
    await refuelingRepository.remove(id);
    load();
  };

  const getConsumptionFor = (item: Refueling, index: number): number | null => {
    const previous = items[index + 1];
    if (!previous) return null;
    const distance = item.odometer - previous.odometer;
    if (distance <= 0) return null;
    return distance / item.liters;
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Abastecimentos" showBack />

      {items.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            title="Nenhum abastecimento registrado"
            description="Registre seu primeiro abastecimento para começar a acompanhar seu consumo."
          />
          <View style={{ paddingHorizontal: theme.spacing.lg }}>
            <Button label="+ Abastecer" onPress={() => navigation.navigate('RefuelingForm')} />
          </View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
          renderItem={({ item, index }) => {
            const consumption = getConsumptionFor(item, index);
            return (
              <Card>
                <View style={styles.row}>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    {formatDate(item.date)}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    {FUEL_LABELS[item.fuelType]}
                  </Text>
                </View>
                {item.establishment ? (
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
                    ]}
                  >
                    📍 {item.establishment}
                  </Text>
                ) : null}
                <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: 4 }]}>
                  {item.liters.toFixed(1)} L · {formatCurrency(item.pricePerLiter)}/L
                </Text>
                <Text
                  style={[
                    theme.typography.subtitle,
                    { color: theme.colors.primary, fontWeight: '700', marginTop: 4 },
                  ]}
                >
                  {formatCurrency(item.totalCost)}
                </Text>
                {consumption !== null && (
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 4 },
                    ]}
                  >
                    Consumo: {formatKmPerLiter(consumption)}
                  </Text>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: theme.spacing.sm,
                    marginTop: theme.spacing.sm,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Editar"
                      variant="outline"
                      onPress={() => navigation.navigate('RefuelingForm', { refuelingId: item.id })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Excluir"
                      variant="outline"
                      onPress={() => handleDelete(item.id)}
                    />
                  </View>
                </View>
              </Card>
            );
          }}
          ListFooterComponent={
            <Button label="+ Abastecer" onPress={() => navigation.navigate('RefuelingForm')} />
          }
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
