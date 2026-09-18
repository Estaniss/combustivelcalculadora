/**
 * =============================================================
 *  ARQUIVO PRINCIPAL DE CONFIGURAÇÃO DO APP
 * =============================================================
 * Este é o ÚNICO arquivo que normalmente precisa ser editado
 * para transformar este template em um novo aplicativo.
 * =============================================================
 */
import { adsConfig } from './ads.config';

export interface AppConfig {
  appName: string;
  appSlug: string;
  appVersion: string;
  appDescription: string;
  developerName: string;
  contactEmail: string;

  primaryColor: string;
  secondaryColor: string;

  showAbout: boolean;
  showSettings: boolean;
  showOnboarding: boolean;

  enableAnalytics: boolean;
  enableAds: boolean;
  enableBanner: boolean;
  enableInterstitial: boolean;
  enableRewarded: boolean;

  minimumIntervalBetweenInterstitials: number;

  privacyPolicyUrl: string;
  termsUrl: string;

  /** package name Android — usado para montar a URL da Play Store */
  androidPackageName: string;
}

export const appConfig: AppConfig = {
  appName: 'Combustível — Calculadora e Controle',
  appSlug: 'combustivel-calculadora-controle',
  appVersion: '1.0.0',
  appDescription:
    'Calcule gastos de viagem, compare gasolina x etanol e controle seus abastecimentos.',
  developerName: 'Seu Nome / Sua Empresa',
  contactEmail: 'contato@seuapp.com',

  primaryColor: '#0E7C3A',
  secondaryColor: '#F5A623',

  showAbout: true,
  showSettings: true,
  showOnboarding: true,

  enableAnalytics: false, // TEMP: desligado para rodar no Expo Go sem dev client — reative quando for testar em development build
  enableAds: true, // TEMP: idem — ver nota no README sobre incompatibilidade do react-native-google-mobile-ads 14.x com old architecture
  enableBanner: true,
  enableInterstitial: true,
  enableRewarded: false,

  minimumIntervalBetweenInterstitials: 60_000,

  privacyPolicyUrl: 'https://seusite.com/privacidade',
  termsUrl: 'https://seusite.com/termos',

  androidPackageName: 'com.estanislau.combustivelcalculadora',
};

export function getPlayStoreUrl(): string {
  return `https://play.google.com/store/apps/details?id=${appConfig.androidPackageName}`;
}

export { adsConfig };
