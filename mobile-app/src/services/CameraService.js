import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { AuthService } from './AuthService';

const API_BASE_URL = 'http://localhost:8000/api/v1'; // Change this to your server URL

export class CameraService {
  static async requestPermissions() {
    try {
      const permissions = {
        camera: false,
        mediaLibrary: false,
        location: false
      };

      // Check and request camera permission with null checks
      try {
        let cameraPermission = await ImagePicker.getCameraPermissionsAsync();
        if (cameraPermission && cameraPermission.status !== 'granted') {
          cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        }
        permissions.camera = cameraPermission && cameraPermission.status === 'granted';
      } catch (cameraError) {
        console.error('Camera permission error:', cameraError);
        permissions.camera = false;
      }
      
      // Check and request media library permission with null checks
      try {
        let mediaLibraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (mediaLibraryPermission && mediaLibraryPermission.status !== 'granted') {
          mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
        permissions.mediaLibrary = mediaLibraryPermission && mediaLibraryPermission.status === 'granted';
      } catch (mediaError) {
        console.error('Media library permission error:', mediaError);
        permissions.mediaLibrary = false;
      }
      
      // Check and request location permission with null checks
      try {
        let locationPermission = await Location.getForegroundPermissionsAsync();
        if (locationPermission && locationPermission.status !== 'granted') {
          locationPermission = await Location.requestForegroundPermissionsAsync();
        }
        permissions.location = locationPermission && locationPermission.status === 'granted';
      } catch (locationError) {
        console.error('Location permission error:', locationError);
        permissions.location = false;
      }
      
      return permissions;
    } catch (error) {
      console.error('Permission request error:', error);
      return { camera: false, mediaLibrary: false, location: false };
    }
  }

  static async getCurrentLocation() {
    try {
      // First check if location services are enabled
      const locationServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!locationServicesEnabled) {
        throw new Error('Location services are disabled');
      }

      // Check permissions first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // Increased timeout
        maximumAge: 60000, // 1 minute
      });

      // Validate location data
      if (!location || !location.coords) {
        throw new Error('Invalid location data received');
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || null,
        timestamp: location.timestamp || Date.now()
      };
    } catch (error) {
      console.error('Get location error:', error);
      
      // Try fallback with lower accuracy
      try {
        console.log('Trying fallback location with lower accuracy...');
        const fallbackLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeout: 10000,
          maximumAge: 120000, // 2 minutes
        });

        if (fallbackLocation && fallbackLocation.coords) {
          return {
            latitude: fallbackLocation.coords.latitude,
            longitude: fallbackLocation.coords.longitude,
            accuracy: fallbackLocation.coords.accuracy || null,
            timestamp: fallbackLocation.timestamp || Date.now()
          };
        }
      } catch (fallbackError) {
        console.error('Fallback location also failed:', fallbackError);
      }
      
      throw new Error(`Unable to get current location: ${error.message}`);
    }
  }

  static async capturePhotoWithLocation() {
    try {
      // Get current location first (optional - don't fail if location fails)
      let location = null;
      try {
        location = await this.getCurrentLocation();
      } catch (locationError) {
        console.warn('Could not get location for photo capture:', locationError);
        // Continue without location - photo capture should still work
      }
      
      // Check camera permission before launching
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }
      
      // Capture photo with error handling
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      // Validate result
      if (!result || result.canceled || !result.assets || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        throw new Error('Invalid photo data - no URI');
      }

      return {
        photoUri: asset.uri,
        location: location,
        exif: asset.exif || null
      };
      
    } catch (error) {
      console.error('Capture photo error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('permission')) {
        throw new Error('카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
      } else if (error.message.includes('Camera')) {
        throw new Error('카메라를 사용할 수 없습니다. 다른 앱에서 카메라를 사용 중일 수 있습니다.');
      } else {
        throw new Error(`사진 촬영 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  }

  static async selectPhotoFromGallery() {
    try {
      // Check media library permission before launching
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      // Validate result
      if (!result || result.canceled || !result.assets || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        throw new Error('Invalid photo data - no URI');
      }

      // Try to get current location for gallery photos (optional)
      let location = null;
      try {
        location = await this.getCurrentLocation();
      } catch (error) {
        console.warn('Could not get location for gallery photo:', error);
        // Continue without location - gallery selection should still work
      }

      return {
        photoUri: asset.uri,
        location: location,
        exif: asset.exif || null
      };
      
    } catch (error) {
      console.error('Select photo error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('permission')) {
        throw new Error('사진 라이브러리 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
      } else {
        throw new Error(`사진 선택 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  }

  static async uploadPhotoForAnalysis(photoUri, gpsData) {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      
      if (gpsData) {
        formData.append('latitude', gpsData.latitude.toString());
        formData.append('longitude', gpsData.longitude.toString());
      }

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
      const token = await AuthService.getAuthToken();
      
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

  static async pollAnalysisResult(requestId, maxAttempts = 30, interval = 2000) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          attempts++;
          const result = await this.getAnalysisStatus(requestId);
          
          if (result.status === 'COMPLETED') {
            resolve(result);
          } else if (result.status === 'FAILED') {
            reject(new Error('Analysis failed'));
          } else if (attempts >= maxAttempts) {
            reject(new Error('Analysis timeout'));
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(poll, interval);
          }
        }
      };
      
      poll();
    });
  }
}
