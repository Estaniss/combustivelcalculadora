import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '@theme/index';
import { appConfig } from '@config/app.config';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Badge } from '@components/Badge';
import { Icon } from '@components/Icon';
import { Illustration, IllustrationName } from '@components/Illustration';
import { BannerAd } from '@components/BannerAd';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { vehicleRepository } from '@features/vehicles/services/vehicleRepository';
import { refuelingRepository } from '@features/refueling/services/refuelingRepository';
import { VehicleGlyph } from '@features/vehicles/components/VehicleGlyph';
import { Vehicle } from '@/domain/vehicle';
import { Refueling } from '@/domain/refueling';
import { formatCurrency, formatKmPerLiter } from '@utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const QUICK_ACTIONS: {
  label: string;
  hint: string;
  route: keyof RootStackParamList;
  illustration: IllustrationName;
}[] = [
  { label: 'Quanto vou\ngastar?', hint: 'Calcular custo de viagem', route: 'TripCalculator', illustration: 'route' },
  { label: 'Gasolina\nx Etanol', hint: 'Comparar combustíveis', route: 'FuelComparison', illustration: 'drops' },
  { label: 'Meu\nconsumo', hint: 'Calcular consumo do carro', route: 'Consumption', illustration: 'gauge' },
  { label: 'Abastecer', hint: 'Registrar abastecimento', route: 'RefuelingForm', illustration: 'pump' },
  { label: 'Modo\nviagem', hint: 'Rastrear viagem por GPS', route: 'TripMode', illustration: 'trip' },
  { label: 'Postos\nperto', hint: 'Ver postos de combustível próximos', route: 'StationsMap', illustration: 'station' },
];

function ActionCard({
  action,
  onPress,
}: {
  action: (typeof QUICK_ACTIONS)[number];
  onPress: () => void;
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (v: number) => {
    if (reduced) return;
    Animated.timing(scale, { toValue: v, duration: theme.motion.fast, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={action.hint}
        style={[
          styles.actionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        <Illustration name={action.illustration} size={64} />
        <Text
          numberOfLines={2}
          style={[theme.typography.captionBold, { color: theme.colors.text, textAlign: 'center' }]}
        >
          {action.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lastRefueling, setLastRefueling] = useState<Refueling | null>(null);
  useAnalyticsScreenView('Home');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const selected = await vehicleRepository.getSelected();
        setVehicle(selected);
        if (selected) {
          const history = await refuelingRepository.getByVehicle(selected.id);
          setLastRefueling(history[0] ?? null);
        } else {
          setLastRefueling(null);
        }
      })();
    }, []),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barra de topo */}
      <View style={[styles.topBar, { paddingHorizontal: theme.spacing.xl }]}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[theme.typography.bodyMedium, { color: theme.colors.text, flex: 1, marginRight: 8 }]}
        >
          {appConfig.appName}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Configurações"
          style={({ pressed }) => [
            styles.gearButton,
            {
              backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="sliders" size={20} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero do veículo */}
        {vehicle ? (
          <Card
            accessible
            accessibilityLabel={`Carro principal: ${vehicle.name}`}
            style={[
              styles.hero,
              { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            ]}
          >
            <View style={styles.heroRow}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.full,
                  },
                ]}
              >
                <VehicleGlyph icon={vehicle.icon} size={52} />
              </View>

              <View style={styles.heroText}>
                <Text
                  numberOfLines={1}
                  style={[
                    theme.typography.subtitle,
                    { color: theme.colors.onPrimary, fontFamily: fonts.semibold },
                  ]}
                >
                  {vehicle.name}
                </Text>
                {vehicle.brand || vehicle.model ? (
                  <Text
                    numberOfLines={1}
                    style={[theme.typography.caption, { color: theme.colors.onPrimary, opacity: 0.8 }]}
                  >
                    {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
                  </Text>
                ) : null}
                <View style={[styles.chips, { gap: theme.spacing.xxs, marginTop: theme.spacing.xxs }]}>
                  {vehicle.gasolineConsumption ? (
                    <Badge
                      label={`Gasolina ${formatKmPerLiter(vehicle.gasolineConsumption)}`}
                      tone="accent"
                    />
                  ) : null}
                  {vehicle.ethanolConsumption ? (
                    <Badge
                      label={`Etanol ${formatKmPerLiter(vehicle.ethanolConsumption)}`}
                      tone="accent"
                    />
                  ) : null}
                  {!vehicle.gasolineConsumption && !vehicle.ethanolConsumption && vehicle.averageConsumption ? (
                    <Badge
                      label={`Consumo ${formatKmPerLiter(vehicle.averageConsumption)}`}
                      tone="accent"
                    />
                  ) : null}
                </View>
              </View>
            </View>

            {lastRefueling ? (
              <View
                style={[
                  styles.lastRefueling,
                  {
                    backgroundColor: theme.colors.primaryPressed,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.sm,
                  },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.onPrimary, opacity: 0.8 }]}>
                  Último abastecimento
                </Text>
                <Text
                  style={[theme.typography.bodyMedium, { color: theme.colors.onPrimary }]}
                >
                  {formatCurrency(lastRefueling.totalCost)}
                  {'  ·  '}
                  {lastRefueling.liters.toFixed(1)} L
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => navigation.navigate('Vehicles')}
              accessibilityRole="button"
              accessibilityLabel="Ver meus carros"
              style={[styles.heroLink, { marginTop: theme.spacing.sm }]}
            >
              <Text
                style={[
                  theme.typography.captionBold,
                  { color: theme.colors.onPrimary, textDecorationLine: 'underline' },
                ]}
              >
                Meus carros
              </Text>
              <Icon name="chevron-right" size={14} color={theme.colors.onPrimary} />
            </Pressable>
          </Card>
        ) : (
          <Card>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text, fontFamily: fonts.semibold }]}>
              Cadastre seu carro
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>
              Salve seu veículo para acompanhar consumo e gastos — ou use as calculadoras sem cadastro.
            </Text>
            <View style={{ marginTop: theme.spacing.sm }}>
              <Button
                label="Adicionar carro"
                icon="plus"
                onPress={() => navigation.navigate('VehicleForm', {})}
              />
            </View>
          </Card>
        )}

        {/* Ações rápidas */}
        <View>
          <Text
            style={[theme.typography.microUppercase, { color: theme.colors.textMuted, marginBottom: theme.spacing.xs }]}
          >
            Ações rápidas
          </Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action) => (
              <ActionCard
                key={action.route}
                action={action}
                onPress={() => navigation.navigate(action.route as never)}
              />
            ))}
          </View>
        </View>

        {/* Atalhos secundários */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Histórico"
              icon="history"
              variant="outline"
              onPress={() => navigation.navigate('RefuelingHistory')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Estatísticas"
              icon="chart"
              variant="outline"
              onPress={() => navigation.navigate('Statistics')}
            />
          </View>
        </View>
      </ScrollView>

      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  gearButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { gap: 0 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  lastRefueling: {},
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardWrapper: { width: '47%' },
  actionCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'center',
  },
});
