import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@theme/index';
import { Icon, IconName } from '@components/Icon';
import { useReducedMotion } from '@hooks/useReducedMotion';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** Ícone opcional à esquerda do texto. */
  icon?: IconName;
  style?: ViewStyle;
}

/**
 * Botão em pílula (DESIGN.md). primary = ação principal (cor da marca, cheio);
 * secondary = fundo suave; outline = só borda. Ao toque encolhe levemente
 * (transform, 150 ms), a menos que o usuário tenha pedido "reduzir movimento".
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  onPressIn,
  onPressOut,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const animateTo = (value: number) => {
    if (reducedMotion) return;
    Animated.timing(scale, {
      toValue: value,
      duration: theme.motion.fast,
      useNativeDriver: true,
    }).start();
  };

  const palette = (pressed: boolean) => {
    if (isDisabled) {
      return { bg: theme.colors.disabled, fg: theme.colors.disabledText, border: 'transparent' };
    }
    switch (variant) {
      case 'primary':
        return {
          bg: pressed ? theme.colors.primaryPressed : theme.colors.primary,
          fg: theme.colors.onPrimary,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: pressed ? theme.colors.surfaceMuted : theme.colors.accentSoft,
          fg: theme.colors.primary,
          border: 'transparent',
        };
      default:
        return {
          bg: pressed ? theme.colors.surfaceMuted : 'transparent',
          fg: theme.colors.text,
          border: theme.colors.inputBorder,
        };
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={(event) => {
          animateTo(0.97);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(1);
          onPressOut?.(event);
        }}
        style={({ pressed }) => {
          const colors = palette(pressed);
          return [
            styles.base,
            {
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderWidth: variant === 'outline' ? 1 : 0,
              borderRadius: theme.borderRadius.full,
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.sm,
            },
          ];
        }}
        {...pressableProps}
      >
        {({ pressed }) => {
          const color = palette(pressed).fg;
          return loading ? (
            <ActivityIndicator color={color} />
          ) : (
            <View style={styles.content}>
              {icon ? <Icon name={icon} size={18} color={color} /> : null}
              <Text numberOfLines={1} style={[theme.typography.button, { color }]}>
                {label}
              </Text>
            </View>
          );
        }}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
