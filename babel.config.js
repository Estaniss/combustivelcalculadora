module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@theme': './src/theme',
            '@config': './src/config',
            '@utils': './src/utils',
            '@types': './src/types',
            '@features': './src/features',
          },
        },
      ],
    ],
  };
};
