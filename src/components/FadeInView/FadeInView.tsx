import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, ViewProps } from 'react-native';

/**
 * Entrada suave (fade + leve subida). Anima só opacity/transform com driver
 * nativo, e respeita "reduzir movimento" do sistema. Genérico do template.
 */
export function FadeInView({ children, style, ...rest }: ViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          progress.setValue(1);
          return;
        }
        Animated.timing(progress, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      })
      .catch(() => progress.setValue(1));
    return () => {
      cancelled = true;
    };
  }, [progress]);

  return (
    <Animated.View
      {...rest}
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
