const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for SDK 52 cache issue
config.cacheStores = [];

// Resolver configuration
config.resolver.platforms = ['native', 'web', 'android', 'ios'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Asset extensions
config.resolver.assetExts.push(
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
  'ttf', 'otf', 'woff', 'woff2',
  'mp3', 'mp4', 'mov', 'avi'
);

// Source extensions
config.resolver.sourceExts.push(
  'jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'cjs'
);

// Transformer configuration
config.transformer.minifierPath = require.resolve('metro-minify-terser');

module.exports = config;
