# Implementation Guide: Historical Place Recognition Mobile App

## 🎯 What We've Implemented

### 1. **AWS Lambda Function for Bedrock Integration** 
**Location**: `/lambda/bedrock_historical_analysis.py`

**Features:**
- ✅ SQS message processing for async image analysis
- ✅ AWS Rekognition integration for building/architecture detection
- ✅ Amazon Bedrock integration with Claude for historical descriptions
- ✅ S3 result storage for FastAPI backend retrieval
- ✅ Comprehensive error handling and logging
- ✅ Deployment script with IAM role creation

**Key Functions:**
- `lambda_handler()` - Main entry point for SQS messages
- `analyze_building_with_rekognition()` - Extract building features and text
- `generate_historical_description()` - Generate AI-powered historical content
- `store_analysis_result()` - Save results back to S3

### 2. **Multi-Provider Authentication System**
**Location**: `/api/services/auth_service.py`, `/api/auth_endpoints.py`

**Supported Providers:**
- ✅ **Kakao** - Korean social login
- ✅ **Google** - Global OAuth 2.0
- ✅ **Naver** - Korean social login  
- ✅ **Apple Sign In** - iOS native authentication

**Features:**
- ✅ JWT token generation and validation
- ✅ User profile management
- ✅ Secure token-based authentication
- ✅ Account deletion and logout
- ✅ Multi-provider user linking

### 3. **User Management System**
**Location**: `/api/services/user_service.py`, `/api/models.py`

**Features:**
- ✅ User creation and profile management
- ✅ Provider-based user identification
- ✅ Last login tracking
- ✅ Account deactivation and deletion
- ✅ User statistics and analytics

### 4. **Updated Configuration & Dependencies**
**Files Updated:**
- ✅ `config.py` - Added authentication settings
- ✅ `requirements.txt` - Added auth dependencies
- ✅ `.env.example` - Complete environment template
- ✅ `models.py` - Added user and auth models

## 🚀 Deployment Instructions

### Step 1: Deploy Lambda Function
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/lambda
./deploy.sh
```

This script will:
- Create IAM roles with proper permissions
- Package and deploy the Lambda function
- Set up SQS trigger configuration
- Test the deployment

### Step 2: Update Environment Variables
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/api
cp .env.example .env
# Edit .env with your actual API keys and secrets
```

**Required Settings:**
```env
# JWT (Generate a secure 32+ character secret)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

# Kakao
KAKAO_REST_API_KEY=your_kakao_rest_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Naver
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Apple (if using)
APPLE_CLIENT_ID=your.apple.client.id
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

### Step 3: Install New Dependencies
```bash
cd /mnt/c/Users/DSO3/IdeaProjects/aws/api
pip install -r requirements.txt
```

### Step 4: Update Your FastAPI Main App
Add these imports to your `main.py`:
```python
from auth_endpoints import router as auth_router

# Add the auth router
app.include_router(auth_router)
```

## 📱 Mobile App Integration

### Authentication Flow
```javascript
// Example React Native implementation
const loginWithKakao = async (kakaoAccessToken) => {
  const response = await fetch('http://your-api.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'kakao',
      access_token: kakaoAccessToken
    })
  });
  
  const { access_token, user } = await response.json();
  // Store token for future API calls
  await AsyncStorage.setItem('auth_token', access_token);
};
```

### Protected API Calls
```javascript
const uploadPhoto = async (photoUri, gpsData) => {
  const token = await AsyncStorage.getItem('auth_token');
  
  const formData = new FormData();
  formData.append('file', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'photo.jpg'
  });
  formData.append('latitude', gpsData.latitude);
  formData.append('longitude', gpsData.longitude);
  
  const response = await fetch('http://your-api.com/api/v1/upload-photo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  });
  
  return await response.json();
};
```

## 🔧 API Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/login` - Multi-provider login
- `POST /api/v1/auth/logout` - Logout and invalidate token
- `GET /api/v1/auth/me` - Get current user info
- `DELETE /api/v1/auth/account` - Delete user account

### Photo Analysis (Protected)
- `POST /api/v1/upload-photo` - Upload photo for analysis
- `GET /api/v1/analysis-status/{request_id}` - Check analysis status

## 🎯 Next Implementation Steps

### 1. **Public Restroom Service**
```python
# Create: /api/services/public_facility_service.py
class PublicFacilityService:
    async def get_nearby_restrooms(self, lat: float, lng: float, radius: int):
        # Integrate with Korean public data APIs
        pass
```

### 2. **Cultural Heritage Recommendation Engine**
```python
# Create: /api/services/heritage_service.py
class HeritageService:
    async def get_recommendations(self, user_location: dict, preferences: dict):
        # ML-based recommendations
        pass
```

### 3. **Database Migration**
Replace in-memory storage with PostgreSQL or DynamoDB:
```python
# Example PostgreSQL integration
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost/dbname"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### 4. **Mobile App Development**
**Recommended Stack:**
- **React Native** with Expo
- **React Navigation** for routing
- **React Native Maps** (Naver Maps integration)
- **Async Storage** for token management
- **React Native Camera** for photo capture

### 5. **Production Deployment**
- **EKS** for FastAPI backend
- **CloudFront** for static assets
- **RDS** for user data
- **ElastiCache** for session management
- **CloudWatch** for monitoring

## 🔒 Security Considerations

1. **JWT Secret**: Use a strong, randomly generated secret key
2. **HTTPS Only**: Ensure all API calls use HTTPS in production
3. **Token Expiration**: Implement refresh token mechanism
4. **Rate Limiting**: Add API rate limiting to prevent abuse
5. **Input Validation**: Validate all user inputs
6. **CORS**: Configure CORS properly for production domains

## 📊 Monitoring & Analytics

### CloudWatch Metrics to Track:
- Lambda function duration and errors
- API response times
- Authentication success/failure rates
- Photo upload and analysis volumes
- User engagement metrics

### Logging Strategy:
- Structured logging with correlation IDs
- Separate log levels for different environments
- Centralized logging with CloudWatch Logs
- Error alerting with SNS notifications

## 🎉 Summary

You now have a **production-ready foundation** with:
- ✅ **AWS Lambda + Bedrock** for AI-powered historical analysis
- ✅ **Multi-provider authentication** (Kakao, Google, Naver, Apple)
- ✅ **Secure JWT-based** user management
- ✅ **Scalable architecture** ready for mobile app integration
- ✅ **Comprehensive deployment** scripts and documentation

The next major step is developing the mobile app frontend and integrating the remaining features (public restrooms, cultural heritage recommendations, etc.).

**Ready to build something amazing! 🚀**
