# Naver Maps API Integration Guide

## 🗺️ Overview

Your app now integrates with **Naver Maps API** as the primary location service, combined with:
- **OpenRestroom API** for public restroom data
- **Cultural Property API** for Korean heritage sites
- **Naver Local Search** for enhanced location information

## 🔑 API Keys Required

### 1. **Naver Cloud Platform** (Primary)
**Website**: https://www.ncloud.com/
**Services Used**:
- Maps Geocoding API
- Maps Reverse Geocoding API  
- Search API (Local)

**Steps to get API keys:**
1. Register at https://www.ncloud.com/
2. Go to Console → AI·Application Service → Maps
3. Create application and get:
   - `Client ID` (NAVER_CLIENT_ID)
   - `Client Secret` (NAVER_CLIENT_SECRET)

### 2. **Cultural Property API** (Korean Heritage)
**Website**: http://www.cha.go.kr/
**Steps**:
1. Visit http://www.cha.go.kr/
2. Go to "정보공개" → "오픈API"
3. Register and apply for API access
4. Get your `CULTURAL_PROPERTY_API_KEY`

### 3. **OpenRestroom API** (No Key Required)
**Website**: https://www.refugerestrooms.org/
- Open source API - no authentication required
- Global restroom database
- Community-maintained data

## 🚀 Features Implemented

### **Public Restroom Service**
```python
# Get nearby restrooms with Korean addresses
restrooms = await public_facility_service.get_nearby_restrooms(
    latitude=37.5759, 
    longitude=126.9769, 
    radius=1000
)

# Search restrooms by address
restrooms = await public_facility_service.search_restrooms_by_address("서울시 종로구")
```

**Features:**
- ✅ OpenRestroom API integration
- ✅ Naver Maps reverse geocoding for Korean addresses
- ✅ Distance calculation and filtering
- ✅ Accessibility information (wheelchair, changing tables)
- ✅ Address-based search

### **Cultural Heritage Service**
```python
# Get heritage recommendations
heritage = await heritage_service.get_heritage_recommendations(
    latitude=37.5759,
    longitude=126.9769,
    radius=5000,
    preferences={'categories': ['국보', '보물']}
)

# Search heritage by name
results = await heritage_service.search_heritage_by_name(
    query="경복궁",
    latitude=37.5759,
    longitude=126.9769
)
```

**Features:**
- ✅ Cultural Property API integration
- ✅ Naver Maps geocoding for coordinates
- ✅ Naver Local Search for enhanced info
- ✅ Smart categorization (국보, 보물, 사적, etc.)
- ✅ Distance-based recommendations

## 📱 Mobile App Integration

### **React Native with Naver Maps**

```javascript
// Install Naver Maps for React Native
npm install react-native-nmap --save

// Example usage
import NaverMapView, {Circle, Marker, Path, Polyline, Polygon} from 'react-native-nmap';

const MapScreen = () => {
  const [restrooms, setRestrooms] = useState([]);
  const [heritage, setHeritage] = useState([]);
  
  const loadNearbyFacilities = async (location) => {
    // Get restrooms
    const restroomData = await LocationService.getNearbyRestrooms(
      location.latitude, 
      location.longitude
    );
    setRestrooms(restroomData);
    
    // Get heritage sites
    const heritageData = await LocationService.getHeritageRecommendations(
      location.latitude, 
      location.longitude
    );
    setHeritage(heritageData);
  };

  return (
    <NaverMapView
      style={{flex: 1}}
      showsMyLocationButton={true}
      center={{
        zoom: 16,
        tilt: 0,
        latitude: 37.5759,
        longitude: 126.9769
      }}
      onCameraChange={(e) => loadNearbyFacilities(e)}
    >
      {/* Restroom markers */}
      {restrooms.map(restroom => (
        <Marker
          key={restroom.id}
          coordinate={{
            latitude: restroom.latitude,
            longitude: restroom.longitude
          }}
          pinColor="blue"
          caption={{text: restroom.name}}
        />
      ))}
      
      {/* Heritage markers */}
      {heritage.map(site => (
        <Marker
          key={site.id}
          coordinate={{
            latitude: site.latitude,
            longitude: site.longitude
          }}
          pinColor="red"
          caption={{text: site.name}}
        />
      ))}
    </NaverMapView>
  );
};
```

### **Location Services Integration**

```javascript
// Enhanced location service with Naver Maps
class LocationService {
  static async searchByAddress(address) {
    const response = await fetch(
      `${API_BASE_URL}/location/search-by-address?address=${encodeURIComponent(address)}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    return await response.json();
  }
  
  static async getDetailedLocation(latitude, longitude) {
    const response = await fetch(
      `${API_BASE_URL}/location/reverse-geocode?lat=${latitude}&lng=${longitude}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    return await response.json();
  }
}
```

## 🔧 API Endpoints

### **Enhanced Location Endpoints**
```
GET  /api/v1/location/nearby-restrooms
     ?latitude=37.5759&longitude=126.9769&radius=1000

GET  /api/v1/location/heritage-recommendations
     ?latitude=37.5759&longitude=126.9769&radius=5000&categories=국보,보물

GET  /api/v1/location/search
     ?query=경복궁&latitude=37.5759&longitude=126.9769

POST /api/v1/location/geocode
     Body: {"address": "서울시 종로구 사직로 161"}

POST /api/v1/location/reverse-geocode
     Body: {"latitude": 37.5759, "longitude": 126.9769}
```

## 🧪 Testing Your Integration

### 1. **Test Restroom Service**
```bash
curl -X GET "http://localhost:8000/api/v1/location/nearby-restrooms?latitude=37.5759&longitude=126.9769&radius=1000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. **Test Heritage Service**
```bash
curl -X GET "http://localhost:8000/api/v1/location/heritage-recommendations?latitude=37.5759&longitude=126.9769&radius=5000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. **Test Address Search**
```bash
curl -X GET "http://localhost:8000/api/v1/location/search?query=경복궁&latitude=37.5759&longitude=126.9769" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Data Sources & Quality

### **OpenRestroom API**
- **Coverage**: Global (including Korea)
- **Data Quality**: Community-maintained
- **Update Frequency**: Real-time user submissions
- **Accessibility Info**: ✅ Wheelchair, changing tables, unisex

### **Cultural Property API**
- **Coverage**: Official Korean cultural heritage sites
- **Data Quality**: Government-maintained (highest quality)
- **Categories**: 국보, 보물, 사적, 명승, 천연기념물, etc.
- **Update Frequency**: Official government updates

### **Naver Maps Enhancement**
- **Geocoding**: Korean address ↔ coordinates
- **Local Search**: Additional business information
- **Address Standardization**: Korean road addresses
- **POI Data**: Points of interest enhancement

## 🎯 Optimization Tips

### **Performance**
```python
# Cache geocoding results
@lru_cache(maxsize=1000)
async def cached_geocode(address: str):
    return await geocode_address(address)

# Batch process multiple locations
async def batch_enhance_locations(locations: List[Dict]):
    tasks = [enhance_location(loc) for loc in locations]
    return await asyncio.gather(*tasks)
```

### **Rate Limiting**
```python
# Implement rate limiting for Naver APIs
from asyncio import Semaphore

class RateLimitedService:
    def __init__(self, max_concurrent=10):
        self.semaphore = Semaphore(max_concurrent)
    
    async def api_call(self, *args, **kwargs):
        async with self.semaphore:
            await asyncio.sleep(0.1)  # 100ms delay
            return await actual_api_call(*args, **kwargs)
```

## 🔒 Security & Best Practices

### **API Key Security**
- Store Naver API keys in environment variables
- Use different keys for development/production
- Monitor API usage in Naver Cloud Console
- Implement request logging for debugging

### **Error Handling**
```python
async def safe_api_call(api_func, *args, **kwargs):
    try:
        return await api_func(*args, **kwargs)
    except httpx.TimeoutException:
        logger.warning("API timeout - using cached data")
        return get_cached_data()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logger.warning("Rate limit exceeded - backing off")
            await asyncio.sleep(1)
            return await api_func(*args, **kwargs)
        raise
```

## 🚀 Deployment Checklist

- [ ] Naver Cloud Platform account created
- [ ] Maps API enabled and keys obtained
- [ ] Cultural Property API key obtained
- [ ] Environment variables configured
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Mobile app Naver Maps SDK integrated
- [ ] API endpoints tested with real data

## 📈 Next Steps

1. **Get your Naver Maps API keys** from Naver Cloud Platform
2. **Get Cultural Property API key** from Korean government
3. **Test the APIs** with real Korean locations
4. **Integrate Naver Maps SDK** in your mobile app
5. **Add caching layer** for better performance
6. **Implement offline mode** for saved locations

**Your location services are now powered by the best Korean mapping platform! 🗺️**
