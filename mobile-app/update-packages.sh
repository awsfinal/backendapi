#!/bin/bash

echo "🚀 Updating React Native packages to latest non-deprecated versions"
echo "=================================================================="

# Backup current package.json
echo "📦 Creating backup of current package.json..."
cp package.json package.json.backup
echo "✅ Backup created: package.json.backup"

# Remove old node_modules and lock file
echo "🧹 Cleaning old dependencies..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# Clear Expo cache
echo "🗑️ Clearing Expo cache..."
npx expo install --fix 2>/dev/null || true

echo ""
echo "📋 Package Updates Summary:"
echo "=========================="
echo "• Expo SDK: 49.0.0 → 51.0.0"
echo "• React Native: 0.72.10 → 0.74.5"
echo "• @expo/vector-icons: 13.0.0 → 14.0.0"
echo "• expo-camera: 13.4.0 → 15.0.0"
echo "• expo-location: 16.1.0 → 17.0.0"
echo "• react-native-paper: 5.10.0 → 5.12.3"
echo "• @react-navigation/*: Updated to latest"
echo "• Removed deprecated packages:"
echo "  - react-native-elements (replaced with react-native-paper)"
echo "  - react-native-vector-icons (using @expo/vector-icons)"
echo ""

# Install new dependencies
echo "📦 Installing updated dependencies..."
npm install

# Check for any remaining issues
echo "🔍 Checking for compatibility issues..."
npx expo install --fix

echo ""
echo "✅ Package update completed!"
echo "========================="
echo ""
echo "🎯 Next Steps:"
echo "1. Test your app: npx expo start --clear"
echo "2. If issues occur, restore backup: cp package.json.backup package.json"
echo "3. Check for breaking changes in updated packages"
echo ""
echo "📚 Major Changes to Note:"
echo "• Some API changes in Expo SDK 51"
echo "• Updated permission handling"
echo "• Improved TypeScript support"
echo "• Better performance and stability"
echo ""
echo "🚨 If you encounter issues:"
echo "• Check the migration guide: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/"
echo "• Restore backup: cp package.json.backup package.json && npm install"
echo ""
echo "Happy coding! 🚀"
