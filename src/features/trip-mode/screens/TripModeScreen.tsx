import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '@theme/index';
import { Header } from '@components/Header';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Input } from '@components/Input';
import { MoneyInput } from '@components/MoneyInput';
import { FadeInView } from '@components/FadeInView';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { storageService, StorageKeys } from '@services/storage/storageService';
import { vehicleRepository } from '@features/vehicles/services/vehicleRepository';
import { tripRepository } from '@features/trip-calculator/services/tripRepository';
import { getVehicleConsumption } from '@/domain/vehicle';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency, formatDuration, formatKm } from '@utils/format';
import { INPUT_LIMITS, validateNumber } from '@utils/validation';
import {
  discardSession,
  finishSession,
  getActiveSession,
  liveSnapshot,
  startSession,
  subscribeToSession,
  tripInputFromFinished,
  TripSession,
  TripSetup,
} from '../services/tripSession';
import { describeTripSavings, FuelChoice, TripCostSummary } from '../services/tripCosts';
import {
  ensureLocationPermission,
  isTripTrackingActive,
  startTripTracking,
  stopTripTracking,
} from '../services/locationTask';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TripMode'>;
type FieldErrors = Partial<
  Record<'gasolinePrice' | 'ethanolPrice' | 'gasolineConsumption' | 'ethanolConsumption', string>
>;

/** Viagens menores que isso (GPS parado, toque sem querer) não vão para o histórico. */
const MIN_SAVED_TRIP_KM = 0.1;
const FUEL_LABEL: Record<FuelChoice, string> = { gasoline: 'Gasolina', ethanol: 'Etanol' };

function priceError(value: number, label: string): string | undefined {
  if (!value || value <= 0) return `Informe o preço ${label}.`;
  if (value > INPUT_LIMITS.pricePerLiter) return `O preço ${label} parece alto demais.`;
  return undefined;
}

function Stat({ label, value, large }: { label: string; value: string; large?: boolean }) {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flex: 1 }}>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          large ? theme.typography.result : theme.typography.subtitle,
          { color: theme.colors.text, fontVariant: ['tabular-nums'], fontFamily: fonts.semibold },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function TripModeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  useAnalyticsScreenView('TripMode');

  // ----- configuração da viagem -----
  const [fuel, setFuel] = useState<FuelChoice>('gasoline');
  const [gasolinePrice, setGasolinePrice] = useState(0);
  const [ethanolPrice, setEthanolPrice] = useState(0);
  const [gasolineConsumption, setGasolineConsumption] = useState('');
  const [ethanolConsumption, setEthanolConsumption] = useState('');
  const [vehicleName, setVehicleName] = useState<string | undefined>();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  // ----- estado da viagem -----
  const [session, setSession] = useState<TripSession | null>(null);
  const [trackingRunning, setTrackingRunning] = useState(true);
  const [summary, setSummary] = useState<{ data: TripCostSummary; saved: boolean } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [pendingSetup, setPendingSetup] = useState<TripSetup | null>(null);

  // Preenche consumos com os do veículo selecionado.
  useEffect(() => {
    vehicleRepository.getSelected().then((vehicle) => {
      if (!vehicle) return;
      const gasoline = getVehicleConsumption(vehicle, 'gasoline');
      const ethanol = getVehicleConsumption(vehicle, 'ethanol');
      if (gasoline) setGasolineConsumption(String(gasoline).replace('.', ','));
      if (ethanol) setEthanolConsumption(String(ethanol).replace('.', ','));
      setVehicleName(vehicle.name);
    });
  }, []);

  // Ao abrir a tela, retoma uma viagem que já estava em andamento (app fechado/reaberto).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [active, running] = await Promise.all([getActiveSession(), isTripTrackingActive()]);
        if (cancelled) return;
        setSession(active);
        setTrackingRunning(running);
        if (active) setSummary(null);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => subscribeToSession(setSession), []);

  // Relógio da tela (tempo decorrido e aviso de GPS parado).
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session]);

  const buildSetup = (): TripSetup | null => {
    const gasolineCheck = validateNumber(gasolineConsumption, 'o consumo com gasolina', {
      max: INPUT_LIMITS.consumptionKmPerLiter,
    });
    const ethanolCheck = validateNumber(ethanolConsumption, 'o consumo com etanol', {
      max: INPUT_LIMITS.consumptionKmPerLiter,
    });
    const nextErrors: FieldErrors = {
      gasolinePrice: priceError(gasolinePrice, 'da gasolina'),
      ethanolPrice: priceError(ethanolPrice, 'do etanol'),
      gasolineConsumption: gasolineCheck.ok ? undefined : gasolineCheck.error,
      ethanolConsumption: ethanolCheck.ok ? undefined : ethanolCheck.error,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !gasolineCheck.ok || !ethanolCheck.ok) {
      return null;
    }
    return {
      fuel,
      gasoline: { price: gasolinePrice, consumption: gasolineCheck.value },
      ethanol: { price: ethanolPrice, consumption: ethanolCheck.value },
      vehicleName,
    };
  };

  const proceed = async (setup: TripSetup) => {
    setBusy(true);
    setMessage(null);
    setPermissionBlocked(false);
    try {
      const permission = await ensureLocationPermission();
      if (permission !== 'granted') {
        setPermissionBlocked(permission === 'blocked');
        setMessage('Sem a permissão de localização não é possível medir a distância da viagem.');
        return;
      }
      const started = await startSession(setup);
      try {
        await startTripTracking();
      } catch (error) {
        await discardSession();
        throw error;
      }
      setSummary(null);
      setSession(started);
      setTrackingRunning(true);
      analyticsService.trackEvent(AnalyticsEvents.TRIP_MODE_STARTED, { fuel: setup.fuel });
    } catch {
      setMessage(
        'Não foi possível iniciar o GPS. Confira se a localização está ligada e tente de novo.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    const setup = buildSetup();
    if (!setup) return;

    const accepted = await storageService.getItem<boolean>(StorageKeys.TRIP_DISCLOSURE_ACCEPTED);
    if (!accepted) {
      setPendingSetup(setup); // mostra a explicação antes do pedido do sistema
      return;
    }
    await proceed(setup);
  };

  const handleDisclosureAccept = async () => {
    const setup = pendingSetup;
    setPendingSetup(null);
    await storageService.setItem(StorageKeys.TRIP_DISCLOSURE_ACCEPTED, true);
    if (setup) await proceed(setup);
  };

  const handleResumeTracking = async () => {
    try {
      await startTripTracking();
      setTrackingRunning(true);
    } catch {
      setMessage(
        'Não foi possível retomar o GPS. Abra a tela com o app em primeiro plano e tente de novo.',
      );
    }
  };

  const handleFinish = async () => {
    setBusy(true);
    try {
      await stopTripTracking();
      const finished = await finishSession();
      if (!finished) return;

      const saved = finished.summary.distanceKm >= MIN_SAVED_TRIP_KM;
      if (saved) await tripRepository.create(tripInputFromFinished(finished));
      setSummary({ data: finished.summary, saved });
      analyticsService.trackEvent(AnalyticsEvents.TRIP_MODE_FINISHED);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancelar viagem?', 'A distância medida até agora será descartada.', [
      { text: 'Continuar viagem', style: 'cancel' },
      {
        text: 'Cancelar viagem',
        style: 'destructive',
        onPress: async () => {
          await stopTripTracking();
          await discardSession();
        },
      },
    ]);
  };

  const snapshot = session ? liveSnapshot(session, now) : null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Modo Viagem" showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---------- VIAGEM EM ANDAMENTO ---------- */}
        {session && snapshot ? (
          <FadeInView style={{ gap: theme.spacing.md }}>
            <Card style={{ gap: theme.spacing.md }}>
              <Text
                accessibilityRole="header"
                style={[
                  theme.typography.subtitle,
                  { color: theme.colors.text, fontFamily: fonts.semibold },
                ]}
              >
                Viagem em andamento · {FUEL_LABEL[session.setup.fuel]}
              </Text>
              <View style={styles.statsRow}>
                <Stat large label="Distância" value={formatKm(snapshot.distanceKm)} />
              </View>
              <View style={styles.statsRow}>
                <Stat label="Custo estimado" value={formatCurrency(snapshot.cost)} />
                <Stat label="Tempo" value={formatDuration(snapshot.elapsedMs)} />
              </View>
            </Card>

            {(snapshot.stale || !trackingRunning) && (
              <Card
                accessibilityLiveRegion="polite"
                style={{ borderColor: theme.colors.warning, borderWidth: 1 }}
              >
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.text, fontFamily: fonts.semibold },
                  ]}
                >
                  GPS sem sinal
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  {trackingRunning
                    ? 'Não chegam leituras há alguns segundos (túnel, garagem ou economia de bateria). A distância pode estar menor que a real.'
                    : 'O rastreio foi interrompido pelo sistema. Retome para continuar medindo.'}
                </Text>
                {!trackingRunning && (
                  <View style={{ marginTop: theme.spacing.xs }}>
                    <Button
                      label="Retomar rastreio"
                      variant="outline"
                      onPress={handleResumeTracking}
                    />
                  </View>
                )}
              </Card>
            )}

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              O rastreio continua com a tela bloqueada. Uma notificação fica fixa enquanto a viagem
              estiver ativa.
            </Text>

            <Button label="Finalizar viagem" onPress={handleFinish} loading={busy} />
            <Button
              label="Cancelar viagem"
              variant="outline"
              onPress={handleCancel}
              disabled={busy}
            />
          </FadeInView>
        ) : summary ? (
          /* ---------- RESUMO ---------- */
          <FadeInView style={{ gap: theme.spacing.md }}>
            <Card style={{ gap: theme.spacing.md }}>
              <Text
                accessibilityRole="header"
                style={[
                  theme.typography.subtitle,
                  { color: theme.colors.text, fontFamily: fonts.semibold },
                ]}
              >
                Resumo da viagem
              </Text>
              <View style={styles.statsRow}>
                <Stat large label="Distância total" value={formatKm(summary.data.distanceKm)} />
              </View>
              <View style={styles.statsRow}>
                <Stat
                  label={`Custo com ${FUEL_LABEL[summary.data.fuel]}`}
                  value={formatCurrency(summary.data.cost)}
                />
                <Stat
                  label={`Com ${FUEL_LABEL[summary.data.alternativeFuel]}`}
                  value={formatCurrency(summary.data.alternativeCost)}
                />
              </View>
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.primary, fontFamily: fonts.semibold },
                ]}
              >
                {describeTripSavings(summary.data)}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {summary.saved
                  ? 'Salva no histórico de viagens.'
                  : 'Viagem muito curta: não foi salva no histórico.'}
              </Text>
            </Card>
            <Button label="Nova viagem" onPress={() => setSummary(null)} />
            <Button
              label="Ver histórico de viagens"
              variant="outline"
              onPress={() => navigation.navigate('TripHistory')}
            />
          </FadeInView>
        ) : (
          /* ---------- CONFIGURAÇÃO ---------- */
          <>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Informe os preços e inicie. O app mede a distância pelo GPS e mostra quanto você
              gastou, comparando com o outro combustível.
            </Text>
            {vehicleName ? (
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Consumos do veículo: {vehicleName}
              </Text>
            ) : null}

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              COMBUSTÍVEL USADO
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
              {(['gasoline', 'ethanol'] as const).map((option) => (
                <View key={option} style={{ flex: 1 }}>
                  <Button
                    label={FUEL_LABEL[option]}
                    variant={fuel === option ? 'primary' : 'outline'}
                    onPress={() => setFuel(option)}
                  />
                </View>
              ))}
            </View>

            <MoneyInput
              label="Preço da gasolina (por litro)"
              value={gasolinePrice}
              onChangeValue={setGasolinePrice}
              error={errors.gasolinePrice}
            />
            <Input
              label="Consumo com gasolina (km/L)"
              keyboard="decimal"
              value={gasolineConsumption}
              onChangeText={setGasolineConsumption}
              placeholder="Ex: 12"
              error={errors.gasolineConsumption}
            />
            <MoneyInput
              label="Preço do etanol (por litro)"
              value={ethanolPrice}
              onChangeValue={setEthanolPrice}
              error={errors.ethanolPrice}
            />
            <Input
              label="Consumo com etanol (km/L)"
              keyboard="decimal"
              value={ethanolConsumption}
              onChangeText={setEthanolConsumption}
              placeholder="Ex: 8,5"
              error={errors.ethanolConsumption}
            />

            {message ? (
              <Text
                accessibilityRole="alert"
                style={[theme.typography.caption, { color: theme.colors.error }]}
              >
                {message}
              </Text>
            ) : null}
            {permissionBlocked && (
              <Button
                label="Abrir configurações do app"
                variant="outline"
                onPress={() => Linking.openSettings()}
              />
            )}

            <Button label="Iniciar viagem" onPress={handleStart} loading={busy} />
          </>
        )}
      </ScrollView>

      {/* Explicação exibida ANTES do pedido de permissão do sistema (1ª vez). */}
      <Modal
        visible={pendingSetup !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPendingSetup(null)}
      >
        <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
          <View
            accessibilityViewIsModal
            style={[
              theme.shadow.md,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xxl,
                padding: theme.spacing.xl,
                gap: theme.spacing.xs,
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[theme.typography.title, { color: theme.colors.text, fontSize: 22 }]}
            >
              Usar sua localização
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Para medir a distância, o app usa o GPS do celular enquanto a viagem estiver ativa,
              inclusive com a tela bloqueada. Uma notificação fica fixa durante esse tempo.
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              O trajeto não é enviado para ninguém nem fica guardado: o app só mantém a distância
              total.
            </Text>
            <View style={{ marginTop: theme.spacing.xs, gap: theme.spacing.xs }}>
              <Button label="Continuar" onPress={handleDisclosureAccept} />
              <Button label="Agora não" variant="outline" onPress={() => setPendingSetup(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 16 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
});
