#!/bin/bash

echo "🚀 Starting Historical Place Recognition App"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile-app directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Get the local IP address
echo "🔍 Detecting network configuration..."

# For Windows (WSL)
if command -v ipconfig.exe &> /dev/null; then
    LOCAL_IP=$(ipconfig.exe | grep -A 4 "Wireless LAN adapter Wi-Fi" | grep "IPv4 Address" | cut -d: -f2 | tr -d ' \r')
    echo "🌐 Detected Windows IP: $LOCAL_IP"
fi

# For Linux/Mac
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    echo "🌐 Detected IP: $LOCAL_IP"
fi

echo ""
echo "📱 Connection Instructions:"
echo "=========================="
echo "1. Make sure your phone and computer are on the same WiFi network"
echo "2. Install 'Expo Go' app on your phone from App Store/Play Store"
echo "3. Your app will be available at:"
echo "   📱 Expo URL: exp://$LOCAL_IP:19000"
echo "   🌐 Web URL: http://localhost:19006"
echo ""
echo "4. If you can't connect:"
echo "   - Update API_CONFIG.BASE_URL in src/config/api.js to: http://$LOCAL_IP:8000/api/v1"
echo "   - Make sure your FastAPI backend is running on port 8000"
echo "   - Check Windows Firewall settings"
echo ""

# Start the backend if it's not running
echo "🔍 Checking if FastAPI backend is running..."
if curl -s http://localhost:8000/api/v1/test/ > /dev/null 2>&1; then
    echo "✅ FastAPI backend is running"
else
    echo "⚠️  FastAPI backend is not running"
    echo "   Please start it with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    echo "   From directory: /mnt/c/Users/DSO3/IdeaProjects/aws/api"
fi

echo ""
echo "🚀 Starting Expo development server..."
echo "======================================"

# Start Expo
npx expo start --lan
