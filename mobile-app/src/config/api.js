// API Configuration for Historical Place Recognition App - PRODUCTION VERSION

// Your FastAPI backend URL
export const API_CONFIG = {
  // Production backend URL
  BASE_URL: 'http://192.168.1.105:8000/api/v1',
  
  // If deploying to production server, update this
  // BASE_URL: 'https://your-domain.com/api/v1',
  
  TIMEOUT: 30000, // 30 seconds
  
  // Health check endpoint
  HEALTH_ENDPOINT: '/health',
  
  // Authentication endpoints
  AUTH_ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  
  // Photo analysis endpoints
  PHOTO_ENDPOINTS: {
    UPLOAD: '/upload-photo',
    STATUS: '/analysis-status'
  },
  
  // Location endpoints (with auth)
  LOCATION_ENDPOINTS: {
    NEARBY_RESTROOMS: '/location/nearby-restrooms',
    HERITAGE_RECOMMENDATIONS: '/location/heritage-recommendations',
    SEARCH: '/location/search',
    SAVE_FAVORITE: '/location/save-favorite',
    FAVORITES: '/location/favorites',
    GEOCODE: '/location/geocode',
    REVERSE_GEOCODE: '/location/reverse-geocode'
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if backend is reachable
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api/v1', '')}${API_CONFIG.HEALTH_ENDPOINT}`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: 'Backend not responding' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
