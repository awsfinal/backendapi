# Complete Setup Guide: Historical Place Recognition App

## 🎯 New Features Implemented

### ✅ **Public Restroom Service**
- Real-time nearby restroom locations
- Korean Public Data Portal integration
- Seoul Open Data API integration
- Distance-based filtering and sorting
- Accessibility information (wheelchair, baby changing)

### ✅ **Cultural Heritage Recommendation Engine**
- Cultural Heritage Administration API integration
- Korea Tourism Organization API integration
- ML-based scoring and recommendations
- Category-based filtering (국보, 보물, 사적, 명승, etc.)
- User preference-based recommendations

### ✅ **Enhanced Location Services**
- Location search functionality
- Favorite locations management
- Multi-source data aggregation
- Duplicate removal and data cleaning

### ✅ **Mobile App Integration Examples**
- Complete React Native service classes
- Authentication flow examples
- Camera and GPS integration
- API integration patterns

## 🔧 API Keys Required

### 1. **Korean Public Data Portal** (공공데이터포털)
**Website**: https://www.data.go.kr/
**Required for**: Public restroom locations

**Steps to get API key:**
1. Register at https://www.data.go.kr/
2. Search for "관광지 화장실 정보" (Tourism Restroom Information)
3. Apply for API usage
4. Get your `PUBLIC_DATA_API_KEY`

### 2. **Seoul Open Data** (서울열린데이터광장)
**Website**: http://data.seoul.go.kr/
**Required for**: Additional Seoul restroom data

**Steps to get API key:**
1. Register at http://data.seoul.go.kr/
2. Apply for API key
3. Get your `SEOUL_OPEN_DATA_API_KEY`

### 3. **Cultural Heritage Administration** (문화재청)
**Website**: http://www.cha.go.kr/
**Required for**: Official heritage site data

**Steps to get API key:**
1. Visit http://www.cha.go.kr/
2. Go to "정보공개" → "오픈API"
3. Register and apply for API access
4. Get your `HERITAGE_API_KEY`

### 4. **Korea Tourism Organization** (한국관광공사)
**Website**: http://api.visitkorea.or.kr/
**Required for**: Tourism and heritage site details

**Steps to get API key:**
1. Register at http://api.visitkorea.or.kr/
2. Apply for API key
3. Get your `KTO_API_KEY`

## 🚀 Installation & Setup

### Step 1: Update Environment Variables
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/api
cp .env.example .env
```

**Edit `.env` with your API keys:**
```env
# Korean Public Data APIs
PUBLIC_DATA_API_KEY=your_public_data_portal_api_key
SEOUL_OPEN_DATA_API_KEY=your_seoul_open_data_api_key
HERITAGE_API_KEY=your_cultural_heritage_api_key
KTO_API_KEY=your_korea_tourism_api_key

# Existing keys...
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
KAKAO_REST_API_KEY=your_kakao_rest_api_key
GOOGLE_CLIENT_ID=your_google_client_id
# ... etc
```

### Step 2: Install New Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Update Your FastAPI Main App
Add these imports to your `main.py`:
```python
from auth_endpoints import router as auth_router
from location_endpoints import router as location_router

# Add the routers
app.include_router(auth_router)
app.include_router(location_router)
```

### Step 4: Deploy Lambda Function
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/lambda
./deploy.sh
```

### Step 5: Test the APIs
```bash
# Start your FastAPI server
cd /mnt/c/Users/DSO3/IdeaProjects/aws/api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Visit: http://localhost:8000/docs to see all new endpoints

## 📱 Mobile App Development

### React Native Setup
```bash
# Install Expo CLI (if not already installed)
npm install -g expo-cli

# Create new React Native project
expo init HistoricalPlaceApp
cd HistoricalPlaceApp

# Install required dependencies
npm install @react-native-async-storage/async-storage
npm install expo-location
npm install expo-image-picker
npm install react-native-maps
```

### Key Dependencies for Mobile App
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.0",
    "expo-location": "^16.0.0",
    "expo-image-picker": "^14.0.0",
    "react-native-maps": "^1.7.0",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/stack": "^6.0.0"
  }
}
```

### Integration Example
Copy the service classes from `/mobile-examples/ReactNativeIntegration.js` to your React Native project.

## 🔗 API Endpoints Reference

### Authentication
- `POST /api/v1/auth/login` - Multi-provider login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Photo Analysis
- `POST /api/v1/upload-photo` - Upload photo for analysis
- `GET /api/v1/analysis-status/{request_id}` - Check analysis status

### Location Services
- `GET /api/v1/location/nearby-restrooms` - Get nearby restrooms
- `GET /api/v1/location/heritage-recommendations` - Get heritage recommendations
- `GET /api/v1/location/search` - Search locations
- `POST /api/v1/location/save-favorite` - Save favorite location
- `GET /api/v1/location/favorites` - Get user's favorites

## 🧪 Testing the New Features

### 1. Test Public Restroom Service
```bash
curl -X GET "http://localhost:8000/api/v1/location/nearby-restrooms?latitude=37.5759&longitude=126.9769&radius=1000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Heritage Recommendations
```bash
curl -X GET "http://localhost:8000/api/v1/location/heritage-recommendations?latitude=37.5759&longitude=126.9769&radius=5000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Location Search
```bash
curl -X GET "http://localhost:8000/api/v1/location/search?query=경복궁&latitude=37.5759&longitude=126.9769" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎨 Mobile App UI Components

### Main Screen Features
```javascript
// Example screen structure
const MainScreen = () => {
  return (
    <View>
      {/* Map with user location */}
      <MapView />
      
      {/* Camera button for photo analysis */}
      <CameraButton onPress={handleTakePhoto} />
      
      {/* Nearby facilities */}
      <NearbyFacilitiesPanel>
        <RestroomList />
        <HeritageList />
      </NearbyFacilitiesPanel>
      
      {/* Search functionality */}
      <SearchBar onSearch={handleSearch} />
    </View>
  );
};
```

### Settings Screen Features
```javascript
const SettingsScreen = () => {
  return (
    <View>
      {/* User profile */}
      <UserProfile user={currentUser} />
      
      {/* App version info */}
      <VersionInfo version="1.0.0" />
      
      {/* Preferences */}
      <PreferencesSection>
        <AccessibilityToggle />
        <LanguageSelector />
        <NotificationSettings />
      </PreferencesSection>
      
      {/* Logout button */}
      <LogoutButton onPress={handleLogout} />
    </View>
  );
};
```

## 🔒 Security Best Practices

### API Security
- ✅ JWT token authentication implemented
- ✅ Token expiration (30 minutes)
- ✅ Input validation on all endpoints
- ✅ CORS configuration
- ⚠️ **TODO**: Implement rate limiting
- ⚠️ **TODO**: Add API key rotation

### Mobile App Security
- Store tokens securely using AsyncStorage
- Implement biometric authentication
- Use HTTPS for all API calls
- Validate server certificates
- Implement certificate pinning for production

## 📊 Performance Optimization

### Backend Optimizations
- ✅ Async/await for all API calls
- ✅ Connection pooling with httpx
- ✅ Duplicate removal algorithms
- ⚠️ **TODO**: Implement caching (Redis)
- ⚠️ **TODO**: Add database connection pooling

### Mobile App Optimizations
- Implement image compression before upload
- Use lazy loading for lists
- Cache API responses locally
- Implement offline mode for favorites
- Use background location updates efficiently

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build Docker image
docker build -t historical-place-api .

# Deploy to EKS or ECS
# Configure load balancer
# Set up CloudWatch monitoring
```

### Mobile App Deployment
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform all
```

## 📈 Monitoring & Analytics

### Key Metrics to Track
- API response times
- Authentication success rates
- Photo analysis completion rates
- User engagement with recommendations
- Location service accuracy
- Error rates by endpoint

### Recommended Tools
- **Backend**: CloudWatch, DataDog, New Relic
- **Mobile**: Firebase Analytics, Crashlytics
- **User Behavior**: Mixpanel, Amplitude

## 🎉 What's Next?

### Immediate Next Steps
1. **Get API keys** from Korean government services
2. **Test all endpoints** with real data
3. **Start mobile app development** using provided examples
4. **Set up production database** (PostgreSQL/DynamoDB)
5. **Implement caching layer** (Redis)

### Future Enhancements
- **Real-time notifications** for nearby heritage events
- **Augmented Reality** overlay for historical information
- **Social features** - share discoveries with friends
- **Offline mode** for downloaded heritage data
- **Multi-language support** (English, Chinese, Japanese)
- **Voice-guided tours** using text-to-speech

## 🤝 Support

If you encounter any issues:
1. Check the API documentation at `/docs`
2. Verify all environment variables are set
3. Ensure API keys have proper permissions
4. Check CloudWatch logs for Lambda function errors

**Your historical place recognition app is now ready for full-scale development! 🚀**
