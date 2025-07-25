# 📱 Fix Expo WiFi IP Address Issue

## 🚨 **Problem**
Expo is showing WSL IP (172.30.186.36) instead of your actual WiFi IP address, so your phone can't connect.

## 🔍 **Find Your Real WiFi IP**

### **Method 1: Windows Command Prompt**
```cmd
# Open Windows Command Prompt (not WSL)
ipconfig

# Look for "Wireless LAN adapter Wi-Fi:"
# Find the IPv4 Address (usually 192.168.x.x or 10.x.x.x)
```

### **Method 2: PowerShell**
```powershell
Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi'
```

### **Method 3: Windows Settings**
1. Open Windows Settings
2. Go to Network & Internet → Wi-Fi
3. Click on your connected network
4. Look for IPv4 address

## 🛠️ **Solutions**

### **Solution 1: Use the Auto Script (Recommended)**
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/mobile-app
./start-expo-wifi.sh
```

### **Solution 2: Manual Start with Your IP**
```bash
# Replace 192.168.1.100 with your actual WiFi IP
export EXPO_DEVTOOLS_LISTEN_ADDRESS=192.168.1.100
npx expo start --lan --host 192.168.1.100 --clear
```

### **Solution 3: Use Tunnel Mode (Always Works)**
```bash
# This bypasses IP issues entirely
npx expo start --tunnel --clear
```

### **Solution 4: Update package.json Scripts**
Add this to your package.json scripts:
```json
{
  "scripts": {
    "start": "expo start",
    "start-wifi": "expo start --lan --host YOUR_WIFI_IP",
    "start-tunnel": "expo start --tunnel"
  }
}
```

## 📱 **Testing Connection**

### **After Starting with Correct IP:**
1. **Check Terminal Output** - Should show your WiFi IP
2. **Scan QR Code** with Expo Go app
3. **Manual URL** - Enter in Expo Go: `exp://YOUR_WIFI_IP:8081`

### **Expected Output:**
```
Starting project at C:\Users\DSO3\IdeaProjects\aws\mobile-app
Starting Metro Bundler

› Metro waiting on exp://192.168.1.100:8081  ← Your WiFi IP
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## 🔧 **Common WiFi IP Ranges**
- **Home Networks**: 192.168.1.x or 192.168.0.x
- **Office Networks**: 10.x.x.x or 172.16.x.x
- **Mobile Hotspot**: 192.168.43.x

## 🚨 **Troubleshooting**

### **If Phone Still Can't Connect:**
1. **Same WiFi Network** - Ensure phone and computer on same WiFi
2. **Firewall** - Temporarily disable Windows Firewall
3. **Port 8081** - Make sure port 8081 is not blocked
4. **Use Tunnel Mode** - `npx expo start --tunnel` (always works)

### **WSL-Specific Issues:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export EXPO_DEVTOOLS_LISTEN_ADDRESS=$(powershell.exe "Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' | Select-Object -ExpandProperty IPAddress" | tr -d '\r')
```

## ✅ **Quick Fix Commands**

### **Get Your WiFi IP:**
```bash
# In WSL
powershell.exe "ipconfig" | grep -A 5 "Wireless LAN adapter Wi-Fi" | grep "IPv4"
```

### **Start Expo with WiFi IP:**
```bash
# Replace with your actual IP
npx expo start --lan --host 192.168.1.100 --clear
```

### **Always-Working Tunnel Mode:**
```bash
npx expo start --tunnel --clear
```

**Your phone should now be able to connect to Expo! 📱✅**
