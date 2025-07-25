# Historical Place Recognition Mobile App

React Native mobile application for recognizing and learning about historical places through AI-powered photo analysis.

## 🚀 Features

### ✅ **Implemented Features**
- **Multi-provider Authentication** (Kakao, Google, Naver, Apple)
- **Camera Integration** with GPS location capture
- **Photo Analysis** with AI-powered historical descriptions
- **Interactive Map** with nearby facilities and heritage sites
- **Location Services** for restrooms and cultural heritage
- **User Settings** with preferences and account management
- **Responsive UI** with Material Design components

### 📱 **Screens**
1. **LoginScreen** - Multi-provider social login
2. **HomeScreen** - Dashboard with nearby facilities and recommendations
3. **CameraScreen** - Photo capture and analysis interface
4. **MapScreen** - Interactive map with markers and search
5. **SettingsScreen** - User preferences and account management
6. **AnalysisResultScreen** - AI analysis results display
7. **HeritageDetailScreen** - Detailed heritage site information

## 🛠️ **Tech Stack**

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **UI Components**: React Native Paper
- **Maps**: React Native Maps
- **State Management**: React Hooks
- **Storage**: AsyncStorage
- **HTTP Client**: Fetch API
- **Icons**: Expo Vector Icons

## 📦 **Installation**

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup
```bash
# Install Expo CLI globally
npm install -g expo-cli

# Navigate to mobile app directory
cd /mnt/c/Users/DSO3/IdeaProjects/aws/mobile-app

# Install dependencies
npm install

# Start the development server
expo start
```

### Running on Device/Simulator
```bash
# Run on Android
expo start --android

# Run on iOS
expo start --ios

# Run on web
expo start --web
```

## 🔧 **Configuration**

### API Configuration
Update the API base URL in service files:

```javascript
// src/services/AuthService.js
// src/services/LocationService.js
// src/services/CameraService.js

const API_BASE_URL = 'http://your-server-url.com/api/v1';
```

### Environment Setup
The app connects to your FastAPI backend. Make sure your backend server is running:

```bash
# Start your FastAPI server
cd /mnt/c/Users/DSO3/IdeaProjects/aws/api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📱 **App Structure**

```
mobile-app/
├── App.js                          # Main app component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
└── src/
    ├── screens/                    # Screen components
    │   ├── HomeScreen.js
    │   ├── CameraScreen.js
    │   ├── MapScreen.js
    │   ├── LoginScreen.js
    │   ├── SettingsScreen.js
    │   ├── AnalysisResultScreen.js
    │   └── HeritageDetailScreen.js
    └── services/                   # API services
        ├── AuthService.js
        ├── LocationService.js
        └── CameraService.js
```

## 🎯 **Key Features Explained**

### 1. **Authentication Flow**
- Multi-provider OAuth (Kakao, Google, Naver, Apple)
- JWT token management
- Automatic login state persistence
- Secure logout and account deletion

### 2. **Photo Analysis**
- Camera integration with GPS capture
- Gallery photo selection
- Real-time analysis progress
- AI-powered historical descriptions
- Building feature detection

### 3. **Location Services**
- Current location detection
- Nearby restroom finder
- Cultural heritage recommendations
- Interactive map with markers
- Address search and geocoding

### 4. **User Experience**
- Material Design UI
- Smooth navigation
- Loading states and error handling
- Offline-friendly design
- Accessibility support

## 🔌 **API Integration**

The app integrates with your FastAPI backend:

### Authentication Endpoints
```javascript
POST /api/v1/auth/login          // Multi-provider login
GET  /api/v1/auth/me             // Get current user
POST /api/v1/auth/logout         // Logout
```

### Location Endpoints
```javascript
GET  /api/v1/test/nearby-restrooms           // Get nearby restrooms
GET  /api/v1/test/heritage-recommendations   // Get heritage sites
GET  /api/v1/test/search                     // Search locations
POST /api/v1/test/geocode                    // Address to coordinates
POST /api/v1/test/reverse-geocode            // Coordinates to address
```

### Photo Analysis Endpoints
```javascript
POST /api/v1/upload-photo                    // Upload photo for analysis
GET  /api/v1/analysis-status/{request_id}    // Get analysis status
```

## 🚀 **Development Workflow**

### 1. **Start Backend Server**
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. **Start Mobile App**
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/mobile-app
expo start
```

### 3. **Test on Device**
- Install Expo Go app on your phone
- Scan QR code from Expo CLI
- Test all features with real backend

## 📱 **Building for Production**

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for both platforms
eas build --platform all
```

## 🔒 **Security Considerations**

1. **API Security**
   - JWT token validation
   - Secure token storage
   - HTTPS communication

2. **Permissions**
   - Camera access for photo capture
   - Location access for nearby services
   - Photo library access for gallery selection

3. **Data Protection**
   - Local data encryption
   - Secure API communication
   - User privacy compliance

## 🐛 **Troubleshooting**

### Common Issues

1. **Metro bundler issues**
   ```bash
   expo start --clear
   ```

2. **Android build issues**
   ```bash
   expo install --fix
   ```

3. **iOS simulator issues**
   ```bash
   expo install --ios
   ```

### Network Issues
- Make sure your backend server is running
- Check API_BASE_URL configuration
- Verify network connectivity

## 🎯 **Next Steps**

### Immediate Enhancements
1. **Real OAuth Integration** - Implement actual OAuth SDKs
2. **Push Notifications** - Add notification support
3. **Offline Mode** - Cache data for offline usage
4. **Performance Optimization** - Image compression and caching

### Future Features
1. **AR Integration** - Augmented reality overlay
2. **Social Features** - Share discoveries with friends
3. **Voice Guide** - Audio descriptions
4. **Multi-language** - Support multiple languages

## 📞 **Support**

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Test with backend server running
- Verify all permissions are granted

**Your React Native app is ready for development and testing! 📱🚀**
