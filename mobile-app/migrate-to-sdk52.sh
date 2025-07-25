#!/bin/bash

echo "🚀 Migrating to Expo SDK 52"
echo "============================"

# Backup current setup
echo "📦 Creating backup..."
cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)
cp app.json app.json.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Clean old dependencies
echo "🧹 Cleaning old dependencies..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Clear caches
echo "🗑️ Clearing caches..."
npm cache clean --force
npx expo install --fix 2>/dev/null || true

echo ""
echo "📋 Expo SDK 52 Updates:"
echo "======================="
echo "• Expo SDK: 51.0.0 → 52.0.0"
echo "• React: 18.2.0 → 18.3.1"
echo "• React Native: 0.74.5 → 0.76.1"
echo "• New Architecture: Enabled"
echo "• React Navigation: v7 (latest)"
echo "• All Expo modules: Updated to SDK 52 versions"
echo ""

echo "🔧 Key Changes in SDK 52:"
echo "========================="
echo "• New Architecture (Fabric + TurboModules) enabled by default"
echo "• Improved performance and memory usage"
echo "• Enhanced TypeScript support"
echo "• Updated Android target SDK to 35"
echo "• iOS deployment target updated to 13.4"
echo "• Better web support with Metro bundler"
echo ""

# Install new dependencies
echo "📦 Installing Expo SDK 52 dependencies..."
npm install

echo ""
echo "🔍 Checking for compatibility issues..."
npx expo install --fix

echo ""
echo "✅ Migration to Expo SDK 52 completed!"
echo "======================================"
echo ""
echo "🎯 Next Steps:"
echo "1. Test your app: npx expo start --clear"
echo "2. Test on iOS: npx expo start --ios"
echo "3. Test on Android: npx expo start --android"
echo "4. Test web version: npx expo start --web"
echo ""
echo "🚨 Breaking Changes to Check:"
echo "• Camera API: Updated permission handling"
echo "• Location API: Enhanced privacy controls"
echo "• Navigation: React Navigation v7 changes"
echo "• New Architecture: Some third-party libraries may need updates"
echo ""
echo "📚 Resources:"
echo "• SDK 52 Release Notes: https://docs.expo.dev/versions/v52.0.0/"
echo "• Migration Guide: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/"
echo "• New Architecture: https://docs.expo.dev/guides/new-architecture/"
echo ""
echo "🆘 If Issues Occur:"
echo "• Restore backup: cp package.json.backup.* package.json"
echo "• Check compatibility: npx expo doctor"
echo "• Clear all caches: npx expo start --clear --reset-cache"
echo ""
echo "Happy coding with Expo SDK 52! 🎉"
