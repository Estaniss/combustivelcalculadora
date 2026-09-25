import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { Header } from '@components/Header';
import { Input } from '@components/Input';
import { MoneyInput } from '@components/MoneyInput';
import { Button } from '@components/Button';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { vehicleRepository } from '@features/vehicles/services/vehicleRepository';
import { refuelingRepository } from '../services/refuelingRepository';
import { RefuelingFuelType } from '@/domain/refueling';
import { parseLocaleNumber, formatCurrency } from '@utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RefuelingForm'>;
type FormRoute = RouteProp<RootStackParamList, 'RefuelingForm'>;

const FUEL_OPTIONS: { key: RefuelingFuelType; label: string }[] = [
  { key: 'gasoline', label: 'Gasolina' },
  { key: 'ethanol', label: 'Etanol' },
  { key: 'diesel', label: 'Diesel' },
];

/** "+ Abastecer" — cria OU edita um abastecimento (dependendo se recebe refuelingId). */
export function RefuelingFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<FormRoute>();
  const refuelingId = route.params?.refuelingId;

  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState(0);
  const [fuelType, setFuelType] = useState<RefuelingFuelType>('gasoline');
  const [fullTank, setFullTank] = useState(true);
  const [establishment, setEstablishment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [noVehicle, setNoVehicle] = useState(false);

  useFocusEffect(
    useCallback(() => {
      vehicleRepository.getSelected().then((vehicle) => {
        if (vehicle) {
          setVehicleId(vehicle.id);
          setNoVehicle(false);
        } else {
          setVehicleId(null);
          setNoVehicle(true);
        }
      });

      if (refuelingId) {
        refuelingRepository.getAll().then((items) => {
          const existing = items.find((r) => r.id === refuelingId);
          if (!existing) return;
          setVehicleId(existing.vehicleId);
          setOdometer(String(existing.odometer));
          setLiters(String(existing.liters));
          setPricePerLiter(existing.pricePerLiter);
          setFuelType(existing.fuelType);
          setFullTank(existing.fullTank);
          setEstablishment(existing.establishment ?? '');
        });
      }
    }, [refuelingId]),
  );

  const totalCost = liters && pricePerLiter ? parseLocaleNumber(liters) * pricePerLiter : 0;

  const handleSave = async () => {
    if (!vehicleId) {
      setError('Cadastre um veículo antes de registrar um abastecimento.');
      return;
    }
    const odometerValue = parseLocaleNumber(odometer);
    const litersValue = parseLocaleNumber(liters);

    if (!odometerValue || odometerValue <= 0) {
      setError('Informe um odômetro válido.');
      return;
    }
    if (!litersValue || litersValue <= 0) {
      setError('Informe uma quantidade de litros válida.');
      return;
    }
    if (!pricePerLiter || pricePerLiter <= 0) {
      setError('Informe um preço por litro válido.');
      return;
    }

    setError(null);
    const input = {
      vehicleId,
      date: new Date().toISOString(),
      odometer: odometerValue,
      liters: litersValue,
      pricePerLiter,
      fuelType,
      fullTank,
      establishment: establishment.trim() || undefined,
    };

    if (refuelingId) {
      await refuelingRepository.update(refuelingId, input);
    } else {
      await refuelingRepository.create(input);
      analyticsService.trackEvent(AnalyticsEvents.REFUELING_CREATED);
    }
    navigation.goBack();
  };

  if (noVehicle) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <Header title="Abastecer" showBack />
        <View style={{ padding: theme.spacing.lg }}>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text, marginBottom: theme.spacing.md },
            ]}
          >
            Cadastre um veículo antes de registrar um abastecimento.
          </Text>
          <Button label="Adicionar carro" onPress={() => navigation.navigate('VehicleForm', {})} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title={refuelingId ? 'Editar abastecimento' : 'Abastecer'} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Odômetro (km)"
          keyboard="decimal"
          value={odometer}
          onChangeText={setOdometer}
          placeholder="Ex: 50450"
        />
        <Input
          label="Litros"
          keyboard="decimal"
          value={liters}
          onChangeText={setLiters}
          placeholder="Ex: 37,5"
        />
        <MoneyInput
          label="Preço por litro"
          value={pricePerLiter}
          onChangeValue={setPricePerLiter}
        />
        <Input
          label="Estabelecimento (opcional)"
          value={establishment}
          onChangeText={setEstablishment}
          placeholder="Ex: Posto Ipiranga - Marginal"
        />

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
          ]}
        >
          COMBUSTÍVEL
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {FUEL_OPTIONS.map((opt) => (
            <View key={opt.key} style={{ flex: 1 }}>
              <Button
                label={opt.label}
                variant={fuelType === opt.key ? 'primary' : 'outline'}
                onPress={() => setFuelType(opt.key)}
              />
            </View>
          ))}
        </View>

        <View style={[styles.row, { marginTop: theme.spacing.sm }]}>
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>Tanque cheio</Text>
          <Switch value={fullTank} onValueChange={setFullTank} />
        </View>

        {totalCost > 0 && (
          <Text
            style={[
              theme.typography.subtitle,
              { color: theme.colors.primary, fontWeight: '700', marginTop: theme.spacing.sm },
            ]}
          >
            Total: {formatCurrency(totalCost)}
          </Text>
        )}

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>{error}</Text>
        ) : null}

        <View style={{ marginTop: theme.spacing.md }}>
          <Button
            label={refuelingId ? 'Salvar alterações' : 'Salvar abastecimento'}
            onPress={handleSave}
          />
        </View>
      </ScrollView>
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
