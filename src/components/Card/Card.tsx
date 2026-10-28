import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@theme/index';

/** Card plano: borda fina, raio 12, sem sombra (nível 0 do DESIGN.md). */
export function Card({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
