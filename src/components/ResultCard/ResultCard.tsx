import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';

export interface ResultCardProps {
  label: string;
  value: string;
}

/** Card com degradê para destacar o resultado de um cálculo. */
export function ResultCard({ label, value }: ResultCardProps) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        theme.shadow.md,
        { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md },
      ]}
    >
      <Text style={[theme.typography.caption, styles.label]}>{label}</Text>
      <Text style={[theme.typography.result, styles.value]}>{value}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
  },
  value: {
    color: '#FFFFFF',
  },
});
