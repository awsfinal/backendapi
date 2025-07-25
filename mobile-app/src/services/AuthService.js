import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000/api/v1'; // Change this to your server URL

export class AuthService {
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

  static async loginWithNaver(naverAccessToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'naver',
          access_token: naverAccessToken
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
      console.error('Naver login error:', error);
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

  static async getStoredUser() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get stored user error:', error);
      return null;
    }
  }

  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }
}
