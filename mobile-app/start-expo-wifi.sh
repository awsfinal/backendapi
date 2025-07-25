#!/bin/bash

echo "🔍 Finding your WiFi IP address..."

# Try to get Windows WiFi IP through WSL
WIFI_IP=$(powershell.exe "Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' | Select-Object -ExpandProperty IPAddress" 2>/dev/null | tr -d '\r')

if [ -z "$WIFI_IP" ]; then
    # Alternative method - check common WiFi IP ranges
    WIFI_IP=$(powershell.exe "ipconfig" | grep -A 5 "Wireless LAN adapter Wi-Fi" | grep "IPv4" | cut -d':' -f2 | tr -d ' \r')
fi

if [ -z "$WIFI_IP" ]; then
    echo "❌ Could not detect WiFi IP automatically"
    echo "📝 Please enter your WiFi IP address manually:"
    echo "   (Check Windows Command Prompt: ipconfig)"
    echo "   (Look for 'Wireless LAN adapter Wi-Fi' -> IPv4 Address)"
    read -p "Enter your WiFi IP: " WIFI_IP
fi

echo "📱 Using WiFi IP: $WIFI_IP"
echo "🚀 Starting Expo with correct IP..."

# Set environment variable to force Expo to use this IP
export EXPO_DEVTOOLS_LISTEN_ADDRESS=$WIFI_IP

# Start Expo with LAN mode
npx expo start --lan --host $WIFI_IP --clear

echo "✅ Expo should now be accessible on your WiFi network!"
echo "📱 Your phone should be able to connect to: exp://$WIFI_IP:8081"
