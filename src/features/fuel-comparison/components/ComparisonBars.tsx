import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { formatCurrency } from '@utils/format';

export interface ComparisonBarsProps {
  gasolineCostPer100Km: number;
  ethanolCostPer100Km: number;
  winner: 'gasoline' | 'ethanol' | 'tie';
}

/**
 * Duas barras horizontais com o custo a cada 100 km. A barra mais curta é a
 * mais barata. O vencedor também recebe o texto "mais barato", então a
 * informação não depende só de cor.
 */
export function ComparisonBars({
  gasolineCostPer100Km,
  ethanolCostPer100Km,
  winner,
}: ComparisonBarsProps) {
  const theme = useTheme();
  const max = Math.max(gasolineCostPer100Km, ethanolCostPer100Km, 0.01);

  const rows = [
    { key: 'gasoline' as const, label: 'Gasolina', value: gasolineCostPer100Km },
    { key: 'ethanol' as const, label: 'Etanol', value: ethanolCostPer100Km },
  ];

  return (
    <View style={{ gap: theme.spacing.xs, width: '100%' }}>
      {rows.map((row) => {
        const isWinner = winner === row.key;
        return (
          <View
            key={row.key}
            accessible
            accessibilityLabel={`${row.label}: ${formatCurrency(row.value)} a cada 100 quilômetros${isWinner ? ', mais barato' : ''}`}
          >
            <View style={styles.labelRow}>
              <Text style={[theme.typography.caption, { color: theme.colors.text }]}>
                {row.label}
                {isWinner ? '  ·  mais barato' : ''}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {formatCurrency(row.value)} / 100 km
              </Text>
            </View>
            <View
              style={[
                styles.track,
                { backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.full },
              ]}
            >
              <View
                style={{
                  width: `${Math.max((row.value / max) * 100, 4)}%`,
                  height: '100%',
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: isWinner ? theme.colors.primary : theme.colors.textSecondary,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  track: {
    height: 12,
    overflow: 'hidden',
  },
});
