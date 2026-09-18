import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';

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
    <View style={styles.container}>
      <Text
        style={[theme.typography.body, { color: theme.colors.error, textAlign: 'center' }]}
        accessibilityRole="alert"
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
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
