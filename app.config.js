const TEST_ANDROID_APP_ID =
  'ca-app-pub-3940256099942544~3347511713';

const TEST_IOS_APP_ID =
  'ca-app-pub-3940256099942544~1458002511';

const isProduction = process.env.APP_ENV === 'production';

module.exports = ({ config }) => ({
  ...config,

  plugins: [
    ...(config.plugins ?? []).filter(
      (plugin) =>
        !(
          Array.isArray(plugin) &&
          plugin[0] === 'react-native-google-mobile-ads'
        ),
    ),

    [
      'react-native-google-mobile-ads',
      {
        androidAppId: isProduction
          ? process.env.ADMOB_ANDROID_APP_ID
          : TEST_ANDROID_APP_ID,

        iosAppId: isProduction
          ? process.env.ADMOB_IOS_APP_ID
          : TEST_IOS_APP_ID,
      },
    ],
  ],
});