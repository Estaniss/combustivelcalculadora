import React from 'react';
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

export function Input({ label, error, keyboard = 'default', ...textInputProps }: InputProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label ? (
        <Text
          style={[styles.label, { color: theme.colors.textSecondary }, theme.typography.caption]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardMap[keyboard]}
        style={[
          styles.input,
          theme.typography.body,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
        {...textInputProps}
      />
      {error ? (
        <Text style={[styles.error, { color: theme.colors.error }, theme.typography.caption]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
  },
  error: {
    marginTop: 4,
  },
});
