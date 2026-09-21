export type AppEnv = 'development' | 'staging' | 'production';

export const APP_ENV: AppEnv =
  (process.env.APP_ENV as AppEnv) ?? 'development';

export const IS_DEV = APP_ENV === 'development';
export const IS_STAGING = APP_ENV === 'staging';
export const IS_PROD = APP_ENV === 'production';