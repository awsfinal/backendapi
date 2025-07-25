import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image
} from 'react-native';
import { Button, Card, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { AuthService } from '../services/AuthService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('');

  const handleLogin = async (provider) => {
    try {
      setLoading(true);
      setLoginType(provider);

      // For demo purposes, we'll simulate OAuth login
      // In a real app, you'd integrate with actual OAuth SDKs
      
      Alert.alert(
        `${provider} 로그인`,
        `${provider} 로그인을 진행하시겠습니까?\n\n(데모 버전에서는 테스트 계정으로 로그인됩니다)`,
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => {
              setLoading(false);
              setLoginType('');
            }
          },
          {
            text: '로그인',
            onPress: async () => {
              try {
                // Simulate OAuth token (in real app, get from OAuth SDK)
                const mockToken = `mock_${provider}_token_${Date.now()}`;
                
                let result;
                switch (provider) {
                  case 'Kakao':
                    result = await AuthService.loginWithKakao(mockToken);
                    break;
                  case 'Google':
                    result = await AuthService.loginWithGoogle(mockToken);
                    break;
                  case 'Naver':
                    result = await AuthService.loginWithNaver(mockToken);
                    break;
                  default:
                    throw new Error('Unsupported provider');
                }

                // Login successful - navigation will be handled by App.js
                console.log('Login successful:', result);
                
              } catch (error) {
                console.error(`${provider} login error:`, error);
                Alert.alert('로그인 실패', error.message || '로그인 중 오류가 발생했습니다.');
              } finally {
                setLoading(false);
                setLoginType('');
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('로그인 오류', '로그인 중 오류가 발생했습니다.');
      setLoading(false);
      setLoginType('');
    }
  };

  const handleSkipLogin = () => {
    Alert.alert(
      '로그인 건너뛰기',
      '로그인하지 않으면 일부 기능이 제한됩니다.\n그래도 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '계속',
          onPress: () => {
            // For demo, we'll create a guest user
            // In real app, you might have limited functionality
            navigation.replace('MainTabs');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{loginType} 로그인 중...</Text>
        <Text style={styles.loadingSubtext}>잠시만 기다려주세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="library" size={80} color="#2196F3" />
        <Text style={styles.title}>역사적 장소 인식</Text>
        <Text style={styles.subtitle}>
          사진으로 발견하는 우리의 문화유산
        </Text>
      </View>

      {/* Login Options */}
      <View style={styles.loginContainer}>
        <Card style={styles.loginCard}>
          <Card.Content>
            <Text style={styles.loginTitle}>로그인</Text>
            <Text style={styles.loginSubtitle}>
              소셜 계정으로 간편하게 시작하세요
            </Text>

            {/* Kakao Login */}
            <TouchableOpacity
              style={[styles.loginButton, styles.kakaoButton]}
              onPress={() => handleLogin('Kakao')}
              disabled={loading}
            >
              <View style={styles.loginButtonContent}>
                <Ionicons name="chatbubble" size={24} color="#000" />
                <Text style={[styles.loginButtonText, styles.kakaoButtonText]}>
                  카카오로 로그인
                </Text>
              </View>
            </TouchableOpacity>

            {/* Google Login */}
            <TouchableOpacity
              style={[styles.loginButton, styles.googleButton]}
              onPress={() => handleLogin('Google')}
              disabled={loading}
            >
              <View style={styles.loginButtonContent}>
                <Ionicons name="logo-google" size={24} color="#fff" />
                <Text style={[styles.loginButtonText, styles.googleButtonText]}>
                  Google로 로그인
                </Text>
              </View>
            </TouchableOpacity>

            {/* Naver Login */}
            <TouchableOpacity
              style={[styles.loginButton, styles.naverButton]}
              onPress={() => handleLogin('Naver')}
              disabled={loading}
            >
              <View style={styles.loginButtonContent}>
                <Text style={styles.naverIcon}>N</Text>
                <Text style={[styles.loginButtonText, styles.naverButtonText]}>
                  네이버로 로그인
                </Text>
              </View>
            </TouchableOpacity>

            {/* Apple Login (iOS only) */}
            {/* <TouchableOpacity
              style={[styles.loginButton, styles.appleButton]}
              onPress={() => handleLogin('Apple')}
              disabled={loading}
            >
              <View style={styles.loginButtonContent}>
                <Ionicons name="logo-apple" size={24} color="#fff" />
                <Text style={[styles.loginButtonText, styles.appleButtonText]}>
                  Apple로 로그인
                </Text>
              </View>
            </TouchableOpacity> */}
          </Card.Content>
        </Card>

        {/* Skip Login */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipLogin}
          disabled={loading}
        >
          <Text style={styles.skipButtonText}>로그인 없이 둘러보기</Text>
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>주요 기능</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="camera" size={20} color="#2196F3" />
            <Text style={styles.featureText}>AI 사진 분석</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="map" size={20} color="#2196F3" />
            <Text style={styles.featureText}>주변 시설 찾기</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="library" size={20} color="#2196F3" />
            <Text style={styles.featureText}>문화재 정보</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  loginContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  loginCard: {
    elevation: 4,
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    elevation: 2,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoButtonText: {
    color: '#000',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  googleButtonText: {
    color: '#fff',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  naverButtonText: {
    color: '#fff',
  },
  naverIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'transparent',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'underline',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
