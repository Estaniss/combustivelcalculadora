import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, fonts } from '@theme/index';
import { mapConfig } from '@config/map.config';
import { Header } from '@components/Header';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { EmptyState } from '@components/EmptyState';
import { Loading } from '@components/Loading';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { ensureLocationPermission } from '@features/trip-mode/services/locationTask';
import { Coordinates } from '@features/trip-mode/services/geo';
import { fetchNearbyStations, clearStationsCache } from '../services/overpass';
import {
  buildDirectionsLinks,
  formatDistance,
  openStatusLabel,
  sortByDistance,
  StationWithDistance,
} from '../services/stationUtils';
import { buildMapHtml } from '../services/mapHtml';
import { commandScript, MapCommand, parseMapEvent } from '../services/mapMessages';

type Status = 'locating' | 'denied' | 'blocked' | 'loading' | 'ready' | 'error';

export function StationsMapScreen() {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);
  useAnalyticsScreenView('StationsMap');

  const [status, setStatus] = useState<Status>('locating');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [stations, setStations] = useState<StationWithDistance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // O HTML só é gerado uma vez por posição: o tema é trocado depois por comando
  // (recriar o HTML recarregaria o mapa inteiro).
  const initialDark = useRef(theme.isDark);
  const html = useMemo(
    () => (origin ? buildMapHtml({ center: origin, dark: initialDark.current }) : null),
    [origin],
  );

  const send = useCallback((command: MapCommand) => {
    webViewRef.current?.injectJavaScript(commandScript(command));
  }, []);

  const load = useCallback(async () => {
    setStatus('locating');
    setMapReady(false);
    try {
      const permission = await ensureLocationPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'blocked' ? 'blocked' : 'denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const here = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setOrigin(here);

      setStatus('loading');
      const found = await fetchNearbyStations(here);
      setStations(sortByDistance(found, here));
      setSelectedId(null);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      analyticsService.trackEvent(AnalyticsEvents.STATIONS_MAP_OPENED);
      load();
    }, [load]),
  );

  // Envia posição e postos ao mapa quando ele estiver pronto e a cada mudança.
  useEffect(() => {
    if (!mapReady || !origin) return;
    send({ type: 'setUser', latitude: origin.latitude, longitude: origin.longitude });
    send({
      type: 'setStations',
      selectedId,
      stations: stations.map(({ id, name, latitude, longitude, openNow }) => ({
        id,
        name,
        latitude,
        longitude,
        openNow,
      })),
    });
  }, [mapReady, origin, stations, selectedId, send]);

  useEffect(() => {
    if (mapReady) send({ type: 'setTheme', dark: theme.isDark });
  }, [mapReady, theme.isDark, send]);

  const select = useCallback(
    (station: StationWithDistance) => {
      setSelectedId(station.id);
      send({ type: 'panTo', latitude: station.latitude, longitude: station.longitude });
    },
    [send],
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseMapEvent(event.nativeEvent.data);
    if (!message) return;
    if (message.type === 'ready') setMapReady(true);
    if (message.type === 'stationPress') setSelectedId(message.id);
  };

  const openDirections = async (url: string) => {
    analyticsService.trackEvent(AnalyticsEvents.STATION_DIRECTIONS_OPENED);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Não foi possível abrir o app de mapas.');
    }
  };

  const selected = stations.find((station) => station.id === selectedId) ?? null;

  if (status === 'locating' || status === 'loading') {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <Header title="Postos perto de você" showBack />
        <Loading />
      </SafeAreaView>
    );
  }

  if (status !== 'ready' || !html) {
    const blocked = status === 'blocked';
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <Header title="Postos perto de você" showBack />
        <EmptyState
          illustration={status === 'error' ? 'offline' : 'station'}
          title={
            status === 'error'
              ? 'Não foi possível buscar os postos'
              : 'Precisamos da sua localização'
          }
          description={
            status === 'error'
              ? 'Confira a internet e tente de novo.'
              : 'Ela é usada só nesta tela, para mostrar os postos mais próximos.'
          }
        />
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.xs }}>
          <Button label="Tentar de novo" onPress={load} />
          {blocked && (
            <Button
              label="Abrir configurações do app"
              variant="outline"
              onPress={() => Linking.openSettings()}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const links = selected ? buildDirectionsLinks(selected) : null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Postos perto de você" showBack />

      <View style={styles.map} accessible={false} importantForAccessibility="no-hide-descendants">
        <WebView
          ref={webViewRef}
          source={{ html, baseUrl: mapConfig.referer }}
          originWhitelist={['https://*', 'about:*']}
          applicationNameForUserAgent={mapConfig.userAgent}
          javaScriptEnabled
          domStorageEnabled={false}
          allowFileAccess={false}
          mixedContentMode="never"
          setSupportMultipleWindows={false}
          onMessage={handleMessage}
          // Links do mapa (ex: atribuição do OSM) abrem no navegador, nunca dentro do WebView.
          onShouldStartLoadWithRequest={(request) => {
            if (request.url === mapConfig.referer || request.url.startsWith('about:')) return true;
            Linking.openURL(request.url).catch(() => undefined);
            return false;
          }}
        />
      </View>

      {/* A lista é a alternativa acessível ao mapa (leitor de tela não lê o WebView). */}
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.xs }}
        ListHeaderComponent={
          selected && links ? (
            <Card style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
              <Text
                accessibilityRole="header"
                style={[
                  theme.typography.subtitle,
                  { color: theme.colors.text, fontFamily: fonts.semibold },
                ]}
              >
                {selected.name}
              </Text>
              {selected.address ? (
                <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                  {selected.address}
                </Text>
              ) : null}
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {formatDistance(selected.distanceMeters)} · {openStatusLabel(selected.openNow)}
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 120 }}>
                  <Button label="Google Maps" onPress={() => openDirections(links.googleMaps)} />
                </View>
                <View style={{ flex: 1, minWidth: 120 }}>
                  <Button
                    label="Waze"
                    variant="outline"
                    onPress={() => openDirections(links.waze)}
                  />
                </View>
                {Platform.OS === 'ios' && (
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <Button
                      label="Apple Maps"
                      variant="outline"
                      onPress={() => openDirections(links.appleMaps)}
                    />
                  </View>
                )}
              </View>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => select(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: item.id === selectedId }}
            accessibilityLabel={`${item.name}, a ${formatDistance(item.distanceMeters)}, ${openStatusLabel(item.openNow)}`}
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderColor: item.id === selectedId ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={[
                  theme.typography.body,
                  { color: theme.colors.text, fontFamily: fonts.semibold },
                ]}
              >
                {item.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
              >
                {openStatusLabel(item.openNow)}
              </Text>
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {formatDistance(item.distanceMeters)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            illustration="station"
            title="Nenhum posto encontrado"
            description="Não há postos cadastrados no OpenStreetMap num raio de 3 km."
          />
        }
        ListFooterComponent={
          <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
            <Button
              label="Atualizar"
              variant="outline"
              onPress={() => {
                clearStationsCache();
                load();
              }}
            />
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Postos e horários vêm do OpenStreetMap, mantido por voluntários, e podem estar
              desatualizados. © colaboradores do OpenStreetMap.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { height: '42%', minHeight: 240 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    minHeight: 56,
  },
});
