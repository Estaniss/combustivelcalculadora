import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';

export interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

export function Header({ title, showBack = false, rightIcon, onRightPress }: HeaderProps) {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing.md,
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
            hitSlop={16}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 24, fontWeight: '600' }}>
              {'‹'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text
        numberOfLines={1}
        style={[theme.typography.subtitle, { color: theme.colors.text, fontWeight: '700' }]}
      >
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>
        {rightIcon ? (
          <Pressable accessibilityRole="button" onPress={onRightPress} hitSlop={12}>
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
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  side: {
    width: 40,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
