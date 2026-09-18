import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

export interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[theme.typography.subtitle, { color: theme.colors.text, fontWeight: '600' }]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 },
          ]}
        >
          {description}
        </Text>
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
