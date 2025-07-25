// React Native Integration Examples for Historical Place Recognition App
// This file contains example code for integrating with your FastAPI backend

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = 'https://your-api-domain.com/api/v1';

// ============================================================================
// Authentication Service
// ============================================================================

class AuthService {
  static async loginWithKakao(kakaoAccessToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'kakao',
          access_token: kakaoAccessToken
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store auth token
        await AsyncStorage.setItem('auth_token', data.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        return data;
      } else {
        throw new Error(data.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Kakao login error:', error);
      throw error;
    }
  }

  static async loginWithGoogle(googleAccessToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          access_token: googleAccessToken
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('auth_token', data.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        return data;
      } else {
        throw new Error(data.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
      }
      
      // Clear local storage
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if API call fails
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
    }
  }

  static async getCurrentUser() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const userData = await response.json();
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        return userData;
      } else {
        // Token might be expired
        await AsyncStorage.multiRemove(['auth_token', 'user_data']);
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

// ============================================================================
// Photo Analysis Service
// ============================================================================

class PhotoAnalysisService {
  static async uploadPhotoForAnalysis(photoUri, gpsData) {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      formData.append('latitude', gpsData.latitude.toString());
      formData.append('longitude', gpsData.longitude.toString());

      const response = await fetch(`${API_BASE_URL}/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Photo upload failed');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  }

  static async getAnalysisStatus(requestId) {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/analysis-status/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Failed to get analysis status');
      }
    } catch (error) {
      console.error('Analysis status error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Location Services
// ============================================================================

class LocationService {
  static async getNearbyRestrooms(latitude, longitude, radius = 1000) {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await fetch(
        `${API_BASE_URL}/location/nearby-restrooms?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
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
      const token = await AsyncStorage.getItem('auth_token');
      
      let url = `${API_BASE_URL}/location/heritage-recommendations?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      
      if (preferences.categories) {
        url += `&categories=${preferences.categories.join(',')}`;
      }
      
      if (preferences.accessibility) {
        url += `&accessibility=true`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
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
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await fetch(
        `${API_BASE_URL}/location/search?query=${encodeURIComponent(query)}&latitude=${latitude}&longitude=${longitude}&radius=${radius}&type=${type}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
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

  static async saveFavoriteLocation(locationData) {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/location/save-favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
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
}

// ============================================================================
// Camera and GPS Utilities
// ============================================================================

class CameraGPSService {
  static async requestPermissions() {
    try {
      // Request camera permission
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request location permission
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      
      return {
        camera: cameraPermission.status === 'granted',
        location: locationPermission.status === 'granted'
      };
    } catch (error) {
      console.error('Permission request error:', error);
      return { camera: false, location: false };
    }
  }

  static async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      };
    } catch (error) {
      console.error('Get location error:', error);
      throw new Error('Unable to get current location');
    }
  }

  static async capturePhotoWithLocation() {
    try {
      // Get current location
      const location = await this.getCurrentLocation();
      
      // Capture photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        return {
          photoUri: result.assets[0].uri,
          location: location,
          exif: result.assets[0].exif
        };
      }
      
      return null;
    } catch (error) {
      console.error('Capture photo error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Example React Native Component Usage
// ============================================================================

/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList } from 'react-native';

const MainScreen = () => {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearbyRestrooms, setNearbyRestrooms] = useState([]);
  const [heritageRecommendations, setHeritageRecommendations] = useState([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check authentication
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Get current location
      const permissions = await CameraGPSService.requestPermissions();
      if (permissions.location) {
        const currentLocation = await CameraGPSService.getCurrentLocation();
        setLocation(currentLocation);
        
        // Load nearby facilities
        loadNearbyFacilities(currentLocation);
      }
    }
  };

  const loadNearbyFacilities = async (location) => {
    try {
      // Get nearby restrooms
      const restrooms = await LocationService.getNearbyRestrooms(
        location.latitude, 
        location.longitude
      );
      setNearbyRestrooms(restrooms);

      // Get heritage recommendations
      const heritage = await LocationService.getHeritageRecommendations(
        location.latitude, 
        location.longitude
      );
      setHeritageRecommendations(heritage);
    } catch (error) {
      Alert.alert('Error', 'Failed to load nearby facilities');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await CameraGPSService.capturePhotoWithLocation();
      
      if (result) {
        // Upload for analysis
        const analysisResult = await PhotoAnalysisService.uploadPhotoForAnalysis(
          result.photoUri,
          result.location
        );
        
        // Navigate to analysis results screen
        // navigation.navigate('AnalysisResults', { requestId: analysisResult.request_id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture and analyze photo');
    }
  };

  const handleLogin = async () => {
    try {
      // Implement Kakao/Google login here
      // const result = await AuthService.loginWithKakao(kakaoToken);
      // setUser(result.user);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity onPress={handleLogin}>
          <Text>Login with Kakao</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Welcome, {user.name}!</Text>
      
      <TouchableOpacity onPress={handleTakePhoto} style={{ marginVertical: 20 }}>
        <Text>Take Photo for Analysis</Text>
      </TouchableOpacity>

      <Text>Nearby Restrooms ({nearbyRestrooms.length})</Text>
      <FlatList
        data={nearbyRestrooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.distance}m away</Text>
          </View>
        )}
      />

      <Text>Heritage Recommendations ({heritageRecommendations.length})</Text>
      <FlatList
        data={heritageRecommendations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.category} - {item.distance}m away</Text>
          </View>
        )}
      />
    </View>
  );
};

export default MainScreen;
*/

export {
  AuthService,
  PhotoAnalysisService,
  LocationService,
  CameraGPSService
};
