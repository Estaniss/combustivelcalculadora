import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { ColorScheme } from '@theme/colors';
import { mix } from '@theme/colorUtils';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

/** Cores do selo: texto na cor do papel, fundo = a mesma cor bem diluída na superfície. */
export function badgeColors(colors: ColorScheme, tone: BadgeTone): { bg: string; fg: string } {
  switch (tone) {
    case 'accent':
      return { bg: colors.accentSoft, fg: colors.primary };
    case 'success':
      return { bg: mix(colors.success, colors.surface, 0.88), fg: colors.success };
    case 'warning':
      return { bg: mix(colors.warning, colors.surface, 0.88), fg: colors.warning };
    case 'error':
      return { bg: mix(colors.error, colors.surface, 0.88), fg: colors.error };
    default:
      return { bg: colors.surfaceMuted, fg: colors.textSecondary };
  }
}

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

/** Selo em pílula (DESIGN.md). O sentido vem sempre do TEXTO, nunca só da cor. */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useTheme();
  const { bg, fg } = badgeColors(theme.colors, tone);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xxs,
      }}
    >
      <Text style={[theme.typography.micro, { color: fg }]}>{label}</Text>
    </View>
  );
}
