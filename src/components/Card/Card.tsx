import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

export function Card({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        theme.shadow.md,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.colors.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
});
