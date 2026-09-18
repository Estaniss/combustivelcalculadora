import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeMode } from '@theme/index';
import { appConfig, getPlayStoreUrl } from '@config/app.config';
import { Header } from '@components/Header';
import { Button } from '@components/Button';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { analyticsService, AnalyticsEvents } from '@services/analytics/analyticsService';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Claro' },
  { mode: 'dark', label: 'Escuro' },
  { mode: 'system', label: 'Sistema' },
];

/**
 * Tela de configurações (TEMPLATE — genérica). "Avaliar" e "Compartilhar"
 * já usam a Play Store URL montada a partir do package name em
 * app.config.ts — não precisa reimplementar isso em cada app novo.
 */
export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  useAnalyticsScreenView('Settings');

  const handleThemeChange = (mode: ThemeMode) => {
    theme.setMode(mode);
    analyticsService.trackEvent(AnalyticsEvents.SETTINGS_THEME_CHANGED, { mode });
  };

  const handleRate = () => {
    Linking.openURL(getPlayStoreUrl());
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira o app ${appConfig.appName}! ${getPlayStoreUrl()}`,
      });
    } catch {
      // usuário cancelou o compartilhamento — sem necessidade de tratar
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Configurações" showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>TEMA</Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          {THEME_OPTIONS.map((opt) => (
            <View key={opt.mode} style={{ flex: 1 }}>
              <Button
                label={opt.label}
                variant={theme.mode === opt.mode ? 'primary' : 'outline'}
                onPress={() => handleThemeChange(opt.mode)}
              />
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
          <Button label="Avaliar aplicativo" variant="outline" onPress={handleRate} />
          <Button label="Compartilhar aplicativo" variant="outline" onPress={handleShare} />
          <Button
            label="Enviar feedback"
            variant="outline"
            onPress={() => Linking.openURL(`mailto:${appConfig.contactEmail}?subject=Feedback`)}
          />
          {appConfig.showAbout && (
            <Button label="Sobre" variant="outline" onPress={() => navigation.navigate('About')} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
