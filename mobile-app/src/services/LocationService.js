import { AuthService } from './AuthService';
import { API_CONFIG, getApiUrl } from '../config/api';

export class LocationService {
  static async getNearbyRestrooms(latitude, longitude, radius = 1000) {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const url = getApiUrl(API_CONFIG.LOCATION_ENDPOINTS.NEARBY_RESTROOMS);
      const response = await fetch(
        `${url}?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: API_CONFIG.TIMEOUT
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        return data.data.restrooms;
      } else {
        throw new Error(data.detail || 'Failed to get nearby restrooms');
      }
    } catch (error) {
      console.error('Nearby restrooms error:', error);
      throw error;
    }
  }

  static async getHeritageRecommendations(latitude, longitude, radius = 5000, preferences = {}) {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      let url = getApiUrl(API_CONFIG.LOCATION_ENDPOINTS.HERITAGE_RECOMMENDATIONS);
      url += `?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      
      if (preferences.categories) {
        url += `&categories=${preferences.categories.join(',')}`;
      }
      
      if (preferences.accessibility) {
        url += `&accessibility=true`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT
      });

      const data = await response.json();
      
      if (response.ok) {
        return data.data.recommendations;
      } else {
        throw new Error(data.detail || 'Failed to get heritage recommendations');
      }
    } catch (error) {
      console.error('Heritage recommendations error:', error);
      throw error;
    }
  }

  static async searchLocations(query, latitude, longitude, radius = 10000, type = 'all') {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const url = getApiUrl(API_CONFIG.LOCATION_ENDPOINTS.SEARCH);
      const response = await fetch(
        `${url}?query=${encodeURIComponent(query)}&latitude=${latitude}&longitude=${longitude}&radius=${radius}&type=${type}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: API_CONFIG.TIMEOUT
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        return data.data.results;
      } else {
        throw new Error(data.detail || 'Search failed');
      }
    } catch (error) {
      console.error('Location search error:', error);
      throw error;
    }
  }

  static async geocodeAddress(address) {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const url = getApiUrl(API_CONFIG.LOCATION_ENDPOINTS.GEOCODE);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
        timeout: API_CONFIG.TIMEOUT
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        return data.data.coordinates;
      } else {
        throw new Error('Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const url = getApiUrl(API_CONFIG.LOCATION_ENDPOINTS.REVERSE_GEOCODE);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
        timeout: API_CONFIG.TIMEOUT
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        return data.data.address;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  static async saveFavoriteLocation(locationData) {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const url = getApiUrl(API_CONFIG.LOCATION_ENDPOINTS.SAVE_FAVORITE);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
        timeout: API_CONFIG.TIMEOUT
      });

      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Failed to save favorite');
      }
    } catch (error) {
      console.error('Save favorite error:', error);
      throw error;
    }
  }

  static async getFavoriteLocations() {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const url = getApiUrl(API_CONFIG.LOCATION_ENDPOINTS.FAVORITES);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT
      });

      const data = await response.json();
      
      if (response.ok) {
        return data.data.favorites;
      } else {
        throw new Error(data.detail || 'Failed to get favorites');
      }
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  }

  static async checkApiStatus() {
    try {
      const healthResult = await checkBackendHealth();
      
      if (healthResult.success) {
        return {
          status: 'healthy',
          timestamp: healthResult.data.timestamp,
          version: healthResult.data.version
        };
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      console.error('API status check error:', error);
      throw error;
    }
  }
}
