import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { EmptyState } from '@components/EmptyState';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { vehicleRepository } from '../services/vehicleRepository';
import { Vehicle } from '@/domain/vehicle';
import { formatKmPerLiter } from '@utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Vehicles'>;

const FUEL_LABELS: Record<Vehicle['fuelType'], string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  flex: 'Flex',
  diesel: 'Diesel',
};

export function VehiclesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useAnalyticsScreenView('Vehicles');

  const load = useCallback(async () => {
    const [all, selected] = await Promise.all([
      vehicleRepository.getAll(),
      vehicleRepository.getSelected(),
    ]);
    setVehicles(all);
    setSelectedId(selected?.id ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSelect = async (vehicle: Vehicle) => {
    await vehicleRepository.selectVehicle(vehicle.id);
    analyticsService.trackEvent(AnalyticsEvents.VEHICLE_SELECTED, { vehicleId: vehicle.id });
    setSelectedId(vehicle.id);
  };

  const handleDelete = async (vehicle: Vehicle) => {
    await vehicleRepository.remove(vehicle.id);
    load();
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Meus carros" showBack />

      {vehicles.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            title="Cadastre seu primeiro carro"
            description="Salve seu veículo para acompanhar consumo e gastos."
          />
          <View style={{ paddingHorizontal: theme.spacing.lg }}>
            <Button
              label="Adicionar carro"
              onPress={() => navigation.navigate('VehicleForm', {})}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleSelect(item)}>
              <Card
                style={[
                  styles.card,
                  item.id === selectedId && { borderColor: theme.colors.primary, borderWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    theme.typography.subtitle,
                    { color: theme.colors.text, fontWeight: '600' },
                  ]}
                >
                  {item.icon} {item.name}
                </Text>
                {(item.brand || item.model) && (
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    {[item.brand, item.model, item.year].filter(Boolean).join(' ')}
                  </Text>
                )}
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {FUEL_LABELS[item.fuelType]}
                  {item.averageConsumption ? ` · ${formatKmPerLiter(item.averageConsumption)}` : ''}
                </Text>

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
                      onPress={() => navigation.navigate('VehicleForm', { vehicleId: item.id })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Excluir" variant="outline" onPress={() => handleDelete(item)} />
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
          ListFooterComponent={
            <Button
              label="+ Adicionar carro"
              onPress={() => navigation.navigate('VehicleForm', {})}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
