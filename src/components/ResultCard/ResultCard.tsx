import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@theme/index';
import { Card } from '@components/Card';

export interface ResultCardProps {
  label: string;
  value: string;
}

/** Resultado de um cálculo: legenda pequena e número grande na cor da marca. */
export function ResultCard({ label, value }: ResultCardProps) {
  const theme = useTheme();
  return (
    <Card accessible accessibilityLabel={`${label}: ${value}`} style={{ alignItems: 'center' }}>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[theme.typography.result, { color: theme.colors.primary }]}>{value}</Text>
    </Card>
  );
}
