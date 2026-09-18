import { useEffect } from 'react';
import { analyticsService } from '@services/analytics/analyticsService';

/** Registra automaticamente um evento de screen_view ao montar a tela. */
export function useAnalyticsScreenView(screenName: string) {
  useEffect(() => {
    analyticsService.trackScreenView(screenName);
  }, [screenName]);
}
