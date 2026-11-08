import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '@theme/index';
import { Header } from '@components/Header';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Badge } from '@components/Badge';
import { EmptyState } from '@components/EmptyState';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { refuelingRepository } from '@features/refueling/services/refuelingRepository';
import { vehicleRepository } from '../services/vehicleRepository';
import { VehicleGlyph } from '../components/VehicleGlyph';
import { Vehicle } from '@/domain/vehicle';
import { formatKmPerLiter, formatNumber } from '@utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Vehicles'>;

const FUEL_LABELS: Record<Vehicle['fuelType'], string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  flex: 'Flex',
  diesel: 'Diesel',
};

/** Chips com os números do carro: consumo por combustível e tanque. */
export function vehicleChips(vehicle: Vehicle): string[] {
  const chips: string[] = [];
  if (vehicle.gasolineConsumption) {
    chips.push(`Gasolina ${formatKmPerLiter(vehicle.gasolineConsumption)}`);
  }
  if (vehicle.ethanolConsumption) {
    chips.push(`Etanol ${formatKmPerLiter(vehicle.ethanolConsumption)}`);
  }
  if (chips.length === 0 && vehicle.averageConsumption) {
    chips.push(`Consumo ${formatKmPerLiter(vehicle.averageConsumption)}`);
  }
  if (vehicle.tankCapacityLiters) {
    chips.push(`Tanque ${formatNumber(vehicle.tankCapacityLiters)} L`);
  }
  return chips;
}

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
    if (vehicle.id === selectedId) return;
    await vehicleRepository.selectVehicle(vehicle.id);
    analyticsService.trackEvent(AnalyticsEvents.VEHICLE_SELECTED, { vehicleId: vehicle.id });
    setSelectedId(vehicle.id);
  };

  const handleDelete = (vehicle: Vehicle) => {
    Alert.alert(
      `Excluir ${vehicle.name}?`,
      'Os abastecimentos deste carro também serão excluídos. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            // primeiro os abastecimentos: se algo falhar, o carro continua e nada fica órfão
            await refuelingRepository.removeByVehicle(vehicle.id);
            await vehicleRepository.remove(vehicle.id);
            await load();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Meus carros" showBack />

      {vehicles.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            illustration="trip"
            title="Cadastre seu primeiro carro"
            description="Salve seu veículo para acompanhar consumo e gastos."
          />
          <View style={{ paddingHorizontal: theme.spacing.xl }}>
            <Button
              label="Adicionar carro"
              icon="plus"
              onPress={() => navigation.navigate('VehicleForm', {})}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.sm }}
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            const chips = vehicleChips(item);
            const meta = [item.brand, item.model, item.year].filter(Boolean).join(' ');
            return (
              <Card
                style={[
                  { gap: theme.spacing.sm },
                  selected && { borderColor: theme.colors.primary, borderWidth: 2 },
                ]}
              >
                <Pressable
                  onPress={() => handleSelect(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name}${selected ? ', carro principal' : ''}`}
                  accessibilityHint={
                    selected ? undefined : 'Toque para usar este carro nos cálculos'
                  }
                  style={styles.row}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: theme.colors.accentSoft,
                        borderRadius: theme.borderRadius.full,
                      },
                    ]}
                  >
                    <VehicleGlyph icon={item.icon} size={60} />
                  </View>
                  <View style={styles.flex}>
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.typography.subtitle,
                        { color: theme.colors.text, fontFamily: fonts.semibold },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {meta ? (
                      <Text
                        numberOfLines={1}
                        style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
                      >
                        {meta}
                      </Text>
                    ) : null}
                    <View
                      style={[
                        styles.chips,
                        { gap: theme.spacing.xxs, marginTop: theme.spacing.xs },
                      ]}
                    >
                      {selected ? <Badge label="Principal" tone="accent" /> : null}
                      <Badge label={FUEL_LABELS[item.fuelType]} />
                      {chips.map((chip) => (
                        <Badge key={chip} label={chip} />
                      ))}
                    </View>
                  </View>
                </Pressable>

                <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                  <Button
                    label="Editar"
                    icon="edit"
                    variant="outline"
                    style={styles.flexStyle}
                    onPress={() => navigation.navigate('VehicleForm', { vehicleId: item.id })}
                  />
                  <Button
                    label="Excluir"
                    icon="trash"
                    variant="outline"
                    style={styles.flexStyle}
                    onPress={() => handleDelete(item)}
                  />
                </View>
              </Card>
            );
          }}
          ListFooterComponent={
            <Button
              label="Adicionar carro"
              icon="plus"
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
  flexStyle: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
