module.exports = function (api) {
  api.cache.using(() =>
    [
      process.env.EXPO_PUBLIC_API_BASE_URL,
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL,
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    ].join('|')
  );
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'react-native-reanimated/plugin', // must be last
    ],
  };
};