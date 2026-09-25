import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { vehicleRepository } from '../services/vehicleRepository';
import { Vehicle, FuelType, VEHICLE_ICONS, VehicleIcon } from '@/domain/vehicle';
import { parseLocaleNumber } from '@utils/format';
import { RootStackParamList } from '@/navigation/types';
import { Autocomplete } from '@components/Autocomplete';
import { CAR_BRANDS } from '@/constants/carBrands';

type Nav = NativeStackNavigationProp<RootStackParamList, 'VehicleForm'>;
type FormRoute = RouteProp<RootStackParamList, 'VehicleForm'>;

const FUEL_OPTIONS: { key: FuelType; label: string }[] = [
  { key: 'flex', label: 'Flex' },
  { key: 'gasoline', label: 'Gasolina' },
  { key: 'ethanol', label: 'Etanol' },
  { key: 'diesel', label: 'Diesel' },
];

/** Cadastro/edição de veículo. O único campo obrigatório é o nome. */
export function VehicleFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<FormRoute>();
  const vehicleId = route.params?.vehicleId;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('flex');
  const [averageConsumption, setAverageConsumption] = useState('');
  const [icon, setIcon] = useState<VehicleIcon>(VEHICLE_ICONS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;
    vehicleRepository.getAll().then((vehicles) => {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return;
      setName(vehicle.name);
      setBrand(vehicle.brand ?? '');
      setModel(vehicle.model ?? '');
      setYear(vehicle.year ? String(vehicle.year) : '');
      setFuelType(vehicle.fuelType);
      setAverageConsumption(vehicle.averageConsumption ? String(vehicle.averageConsumption) : '');
      setIcon(vehicle.icon ?? VEHICLE_ICONS[0]);
    });
  }, [vehicleId]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Informe um nome para o veículo.');
      return;
    }
    setError(null);

    const input = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      year: year ? Number(year) : undefined,
      fuelType,
      averageConsumption: averageConsumption ? parseLocaleNumber(averageConsumption) : undefined,
      icon,
    };

    if (vehicleId) {
      await vehicleRepository.update(vehicleId, input);
    } else {
      await vehicleRepository.create(input);
      analyticsService.trackEvent(AnalyticsEvents.VEHICLE_CREATED);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title={vehicleId ? 'Editar carro' : 'Novo carro'} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          ÍCONE DO VEÍCULO
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {VEHICLE_ICONS.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setIcon(opt)}
              accessibilityRole="button"
              accessibilityLabel={`Ícone ${opt}`}
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
                borderWidth: icon === opt ? 2 : 1,
                borderColor: icon === opt ? theme.colors.primary : theme.colors.border,
              }}
            >
              <Text style={{ fontSize: 26 }}>{opt}</Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="Nome do carro *"
          value={name}
          onChangeText={setName}
          placeholder="Ex: Meu Civic"
        />
        <Autocomplete
          label="Marca (opcional)"
          value={brand}
          onChangeText={setBrand}
          data={CAR_BRANDS}
          placeholder="Digite pra buscar... Ex: Honda"
        />
        <Input
          label="Modelo (opcional)"
          value={model}
          onChangeText={setModel}
          placeholder="Ex: Civic"
        />
        <Input
          label="Ano (opcional)"
          keyboard="numeric"
          value={year}
          onChangeText={setYear}
          placeholder="Ex: 2020"
        />

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
          ]}
        >
          COMBUSTÍVEL
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {FUEL_OPTIONS.map((opt) => (
            <View key={opt.key} style={{ width: '47%' }}>
              <Button
                label={opt.label}
                variant={fuelType === opt.key ? 'primary' : 'outline'}
                onPress={() => setFuelType(opt.key)}
              />
            </View>
          ))}
        </View>

        <Input
          label="Consumo médio em km/L (opcional)"
          keyboard="decimal"
          value={averageConsumption}
          onChangeText={setAverageConsumption}
          placeholder="Ex: 11,8"
        />

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>{error}</Text>
        ) : null}

        <View style={{ marginTop: theme.spacing.md }}>
          <Button label="Salvar" onPress={handleSave} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
