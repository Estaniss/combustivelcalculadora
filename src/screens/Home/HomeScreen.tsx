import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { appConfig } from '@config/app.config';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { BannerAd } from '@components/BannerAd';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { vehicleRepository } from '@features/vehicles/services/vehicleRepository';
import { refuelingRepository } from '@features/refueling/services/refuelingRepository';
import { Vehicle } from '@/domain/vehicle';
import { Refueling } from '@/domain/refueling';
import { formatCurrency, formatKmPerLiter } from '@utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const QUICK_ACTIONS: { label: string; route: keyof RootStackParamList; emoji: string }[] = [
  { label: 'Quanto vou\ngastar?', route: 'TripCalculator', emoji: '🧮' },
  { label: 'Gasolina\nx Etanol', route: 'FuelComparison', emoji: '⚖️' },
  { label: 'Meu\nconsumo', route: 'Consumption', emoji: '📊' },
  { label: 'Abastecer', route: 'RefuelingForm', emoji: '⛽' },
];

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
      <View style={[styles.topBar, { paddingHorizontal: theme.spacing.lg }]}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            theme.typography.title,
            { color: theme.colors.text, fontSize: 20, flex: 1, marginRight: 8 },
          ]}
        >
          {appConfig.appName}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Configurações"
          hitSlop={12}
          style={[
            styles.gearButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        {vehicle ? (
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, theme.shadow.md, { borderRadius: theme.borderRadius.lg }]}
          >
            <Text style={styles.heroEmoji}>{vehicle.icon}</Text>
            <Text style={[theme.typography.subtitle, styles.heroTitle]}>{vehicle.name}</Text>
            <View style={styles.heroStatsRow}>
              {vehicle.averageConsumption ? (
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Consumo médio</Text>
                  <Text style={styles.heroStatValue}>
                    {formatKmPerLiter(vehicle.averageConsumption)}
                  </Text>
                </View>
              ) : null}
              {lastRefueling ? (
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Último abastecimento</Text>
                  <Text style={styles.heroStatValue}>
                    {formatCurrency(lastRefueling.totalCost)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={() => navigation.navigate('Vehicles')}
              style={styles.heroLink}
              accessibilityRole="button"
            >
              <Text style={styles.heroLinkText}>Meus carros ›</Text>
            </Pressable>
          </LinearGradient>
        ) : (
          <Card>
            <Text
              style={[theme.typography.subtitle, { color: theme.colors.text, fontWeight: '700' }]}
            >
              Cadastre seu carro
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 4 },
              ]}
            >
              Salve seu veículo para acompanhar consumo e gastos — ou use as calculadoras sem
              cadastro.
            </Text>
            <View style={{ marginTop: theme.spacing.sm }}>
              <Button
                label="Adicionar carro"
                onPress={() => navigation.navigate('VehicleForm', {})}
              />
            </View>
          </Card>
        )}

        <View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
            ]}
          >
            AÇÕES RÁPIDAS
          </Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.route}
                onPress={() => navigation.navigate(action.route as never)}
                style={({ pressed }) => [
                  styles.actionCard,
                  theme.shadow.sm,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.text, fontWeight: '600' },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="📜 Histórico"
              variant="outline"
              onPress={() => navigation.navigate('RefuelingHistory')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="📈 Estatísticas"
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
    justifyContent: 'space-between',
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
  hero: {
    padding: 20,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 6,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
  },
  heroStat: {},
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  heroLink: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  heroLinkText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  actionEmoji: {
    fontSize: 28,
  },
});
