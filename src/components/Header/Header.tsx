import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { Icon } from '@components/Icon';

export interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightIcon?: React.ReactNode;
  /** Texto lido pelo leitor de tela para o botão da direita (obrigatório se houver rightIcon). */
  rightLabel?: string;
  onRightPress?: () => void;
}

export function Header({
  title,
  showBack = false,
  rightIcon,
  rightLabel,
  onRightPress,
}: HeaderProps) {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.xs },
      ]}
    >
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.touch, pressed && { opacity: 0.55 }]}
          >
            <Icon name="chevron-left" size={26} />
          </Pressable>
        ) : null}
      </View>

      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[
          theme.typography.subtitle,
          { color: theme.colors.text, fontFamily: theme.typography.fonts.semibold },
        ]}
      >
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>
        {rightIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightLabel}
            onPress={onRightPress}
            style={({ pressed }) => [styles.touch, pressed && { opacity: 0.55 }]}
          >
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: { width: 52 },
  sideRight: { alignItems: 'flex-end' },
  // área de toque de 44×44 (DESIGN.md / WCAG)
  touch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
