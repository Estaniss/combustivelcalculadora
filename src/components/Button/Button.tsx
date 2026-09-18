import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  PressableProps,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const textColor = variant === 'outline' ? theme.colors.primary : '#FFFFFF';
  const borderColor = variant === 'outline' ? theme.colors.primary : 'transparent';

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <Text
      style={[
        styles.label,
        { color: isDisabled ? theme.colors.textSecondary : textColor },
        theme.typography.button,
      ]}
    >
      {label}
    </Text>
  );

  // Botão primário ganha um leve degradê entre as cores primária e
  // secundária, com sombra para dar sensação de profundidade.
  if (variant === 'primary' && !isDisabled) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.shadowWrap,
          { opacity: pressed ? 0.9 : 1, borderRadius: theme.borderRadius.md },
          style,
        ]}
        {...pressableProps}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            {
              borderRadius: theme.borderRadius.md,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const backgroundColor = {
    primary: theme.colors.disabled,
    secondary: theme.colors.secondary,
    outline: 'transparent',
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.shadowWrap,
        {
          backgroundColor: isDisabled ? theme.colors.disabled : backgroundColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: pressed ? 0.85 : 1,
          borderRadius: theme.borderRadius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
        style,
      ]}
      {...pressableProps}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    textAlign: 'center',
  },
});
