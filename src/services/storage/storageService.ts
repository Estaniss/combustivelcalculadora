import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Chaves de storage centralizadas. Evita strings mágicas espalhadas
 * pelo app e colisão de chaves entre features.
 */
export const StorageKeys = {
  THEME_MODE: '@app/theme_mode',
  ONBOARDING_SEEN: '@app/onboarding_seen',
  LAST_INTERSTITIAL_SHOWN_AT: '@app/last_interstitial_shown_at',
  CALCULATOR_HISTORY: '@app/calculator_history',
  ANALYTICS_CONSENT: '@app/analytics_consent',
  ADS_PERSONALIZATION_CONSENT: '@app/ads_personalization_consent',

  // --- Chaves específicas do app Combustível (não fazem parte do template) ---
  VEHICLES: '@combustivel/vehicles',
  REFUELINGS: '@combustivel/refuelings',
  SELECTED_VEHICLE_ID: '@combustivel/selected_vehicle_id',
  TRIPS: '@combustivel/trips',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/**
 * Abstração única sobre o AsyncStorage. Nenhuma outra parte do app deve
 * importar '@react-native-async-storage/async-storage' diretamente —
 * isso permite trocar a implementação de storage (ex: MMKV) no futuro
 * alterando apenas este arquivo.
 */
export const storageService = {
  async getItem<T>(key: StorageKey): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      console.warn(`[storageService] falha ao ler "${key}"`, error);
      return null;
    }
  },

  async setItem<T>(key: StorageKey, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[storageService] falha ao gravar "${key}"`, error);
    }
  },

  async removeItem(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[storageService] falha ao remover "${key}"`, error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('[storageService] falha ao limpar storage', error);
    }
  },
};
