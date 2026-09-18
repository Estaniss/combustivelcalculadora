import React from 'react';
import { View, Text, ScrollView, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { appConfig } from '@config/app.config';
import { Header } from '@components/Header';
import { Button } from '@components/Button';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';

/** Tela "Sobre este aplicativo". Todos os dados vêm de app.config.ts. */
export function AboutScreen() {
  const theme = useTheme();
  useAnalyticsScreenView('About');

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Sobre" showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text style={[theme.typography.title, { color: theme.colors.text, fontSize: 22 }]}>
          {appConfig.appName}
        </Text>
        <Text
          style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}
        >
          Versão {appConfig.appVersion}
        </Text>

        <Text
          style={[theme.typography.body, { color: theme.colors.text, marginTop: theme.spacing.lg }]}
        >
          {appConfig.appDescription}
        </Text>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Desenvolvido por
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>
            {appConfig.developerName}
          </Text>
        </View>

        <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
          <Button
            label="Política de Privacidade"
            variant="outline"
            onPress={() => Linking.openURL(appConfig.privacyPolicyUrl)}
          />
          <Button
            label="Termos de Uso"
            variant="outline"
            onPress={() => Linking.openURL(appConfig.termsUrl)}
          />
          <Button
            label="Contato"
            variant="outline"
            onPress={() => Linking.openURL(`mailto:${appConfig.contactEmail}`)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
