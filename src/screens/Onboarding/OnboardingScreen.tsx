import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { onboardingSlides } from '@config/onboarding.config';
import { storageService, StorageKeys } from '@services/storage/storageService';

/**
 * Onboarding genérico (parte do TEMPLATE). O conteúdo dos slides vem de
 * config/onboarding.config.ts — específico de cada app. Nunca obrigatório
 * para quem já concluiu (marca no storage e nunca mais aparece).
 */
export function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const isLast = index === onboardingSlides.length - 1;
  const slide = onboardingSlides[index] ?? onboardingSlides[0];
  if (!slide) return null;

  const handleNext = async () => {
    if (isLast) {
      await storageService.setItem(StorageKeys.ONBOARDING_SEEN, true);
      onFinish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleSkip = async () => {
    await storageService.setItem(StorageKeys.ONBOARDING_SEEN, true);
    onFinish();
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0, 0.55]}
      style={styles.container}
    >
      <SafeAreaView style={styles.flex}>
        <View style={[styles.content, { width, paddingHorizontal: theme.spacing.xl }]}>
          <View style={[styles.emojiBadge, theme.shadow.md]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
          </View>
          <Text
            style={[
              theme.typography.title,
              { color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing.lg },
            ]}
          >
            {slide.title}
          </Text>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: theme.spacing.sm,
              },
            ]}
          >
            {slide.description}
          </Text>
        </View>

        <View style={[styles.dots, { marginBottom: theme.spacing.lg }]}>
          {onboardingSlides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? theme.colors.primary : theme.colors.border,
                  width: i === index ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.sm }}>
          <Button label={isLast ? 'Começar agora' : 'Próximo'} onPress={handleNext} />
          {!isLast && <Button label="Pular" variant="outline" onPress={handleSkip} />}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
