import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@theme/index';

export type InputKeyboard = 'default' | 'numeric' | 'decimal';

export interface InputProps extends Omit<TextInputProps, 'style' | 'keyboardType'> {
  label?: string;
  error?: string;
  keyboard?: InputKeyboard;
}

const keyboardMap: Record<InputKeyboard, TextInputProps['keyboardType']> = {
  default: 'default',
  numeric: 'number-pad',
  decimal: 'decimal-pad',
};

/**
 * Campo de texto (DESIGN.md): borda de 1 px que atende 3:1 de contraste; foco
 * em 2 px na cor da marca; erro em vermelho com mensagem anunciada ao leitor de tela.
 */
export function Input({
  label,
  error,
  keyboard = 'default',
  onFocus,
  onBlur,
  ...textInputProps
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.inputBorder;
  const borderWidth = focused || error ? 2 : 1;

  return (
    <View style={styles.container}>
      {label ? (
        <Text
          style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        keyboardType={keyboardMap[keyboard]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          theme.typography.body,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor,
            borderWidth,
            borderRadius: theme.borderRadius.md,
            // o foco engrossa a borda para dentro: o campo não "pula" de tamanho
            paddingHorizontal: theme.spacing.md - (borderWidth - 1),
          },
        ]}
        {...textInputProps}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[theme.typography.caption, styles.error, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { marginBottom: 6 },
  input: { minHeight: 48 },
  error: { marginTop: 4 },
});
