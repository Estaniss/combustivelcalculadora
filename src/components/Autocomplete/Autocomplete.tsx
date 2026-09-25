import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { Input, InputProps } from '@components/Input';

export interface AutocompleteProps extends Omit<InputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  /** Lista completa de opções para filtrar (ex: marcas de carro). */
  data: string[];
  /** Chamado quando o usuário toca em uma sugestão da lista. */
  onSelectItem?: (item: string) => void;
  maxSuggestions?: number;
}

/**
 * Input de texto com sugestões filtradas conforme o usuário digita.
 * Componente genérico do template — reutilizável em qualquer app da
 * fábrica que precise de um campo "digite e busque" (marca de carro,
 * cidade, categoria, etc). A lista de opções (`data`) é sempre
 * específica de cada uso.
 */
export function Autocomplete({
  value,
  onChangeText,
  data,
  onSelectItem,
  maxSuggestions = 6,
  ...inputProps
}: AutocompleteProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const query = value.trim().toLowerCase();
  const suggestions =
    focused && query.length > 0
      ? data.filter((item) => item.toLowerCase().includes(query)).slice(0, maxSuggestions)
      : [];

  const handleSelect = (item: string) => {
    onChangeText(item);
    onSelectItem?.(item);
    setFocused(false);
  };

  return (
    <View>
      <Input
        {...inputProps}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setFocused(true);
        }}
        onFocus={() => setFocused(true)}
        // pequeno delay pro onPress da sugestão registrar antes do blur fechar a lista
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
            },
            theme.shadow.sm,
          ]}
        >
          {suggestions.map((item, index) => (
            <Pressable
              key={item}
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                styles.suggestionItem,
                index < suggestions.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.text }]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  suggestionsBox: {
    marginTop: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});

export * from './Autocomplete';
