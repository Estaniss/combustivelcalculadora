import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { Illustration, IllustrationName } from '@components/Illustration';

export interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: IllustrationName;
}

export function EmptyState({ title, description, illustration = 'clipboard' }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { padding: theme.spacing.xl, gap: theme.spacing.xs }]}>
      <Illustration name={illustration} size={112} />
      <Text
        accessibilityRole="header"
        style={[
          theme.typography.subtitle,
          {
            color: theme.colors.text,
            fontFamily: theme.typography.fonts.semibold,
            textAlign: 'center',
          },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: 'center' },
          ]}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
