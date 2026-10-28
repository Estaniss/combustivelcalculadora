import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { Illustration } from '@components/Illustration';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Algo deu errado. Tente novamente.',
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { padding: theme.spacing.xl, gap: theme.spacing.xs }]}>
      <Illustration name="offline" size={112} />
      <Text
        accessibilityRole="alert"
        style={[theme.typography.body, { color: theme.colors.text, textAlign: 'center' }]}
      >
        {message}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button label="Tentar novamente" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
