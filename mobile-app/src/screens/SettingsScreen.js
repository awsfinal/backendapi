import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { Card, List, Switch, Button, Divider, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { AuthService } from '../services/AuthService';

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getStoredUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Load user data error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              // Navigation will be handled by App.js when auth state changes
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.\n정말 계정을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '최종 확인',
              '이 작업은 되돌릴 수 없습니다.\n계정 삭제를 진행하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // In real app, call delete account API
                      await AuthService.logout();
                      Alert.alert('완료', '계정이 삭제되었습니다.');
                    } catch (error) {
                      console.error('Delete account error:', error);
                      Alert.alert('오류', '계정 삭제 중 오류가 발생했습니다.');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      '고객 지원',
      '문의사항이나 건의사항이 있으시면 아래 방법으로 연락해주세요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '이메일 보내기',
          onPress: () => {
            Linking.openURL('mailto:support@historicalplace.app?subject=앱 문의');
          }
        }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      '개인정보 처리방침',
      '개인정보 처리방침을 확인하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            // In real app, open privacy policy URL
            Linking.openURL('https://your-app.com/privacy');
          }
        }
      ]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      '서비스 이용약관',
      '서비스 이용약관을 확인하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            // In real app, open terms of service URL
            Linking.openURL('https://your-app.com/terms');
          }
        }
      ]
    );
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'kakao':
        return 'chatbubble';
      case 'google':
        return 'logo-google';
      case 'naver':
        return 'globe';
      case 'apple':
        return 'logo-apple';
      default:
        return 'person';
    }
  };

  const getProviderName = (provider) => {
    switch (provider) {
      case 'kakao':
        return '카카오';
      case 'google':
        return 'Google';
      case 'naver':
        return '네이버';
      case 'apple':
        return 'Apple';
      default:
        return '알 수 없음';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile */}
      {user && (
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Icon
                size={60}
                icon={getProviderIcon(user.provider)}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.name || '사용자'}</Text>
                <Text style={styles.userEmail}>{user.email || ''}</Text>
                <Text style={styles.userProvider}>
                  {getProviderName(user.provider)} 계정
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>앱 설정</Text>
          
          <List.Item
            title="알림"
            description="새로운 정보 및 업데이트 알림"
            left={props => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="위치 서비스"
            description="현재 위치 기반 서비스 사용"
            left={props => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={locationServices}
                onValueChange={setLocationServices}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="자동 분석"
            description="사진 촬영 시 자동으로 분석 시작"
            left={props => <List.Icon {...props} icon="camera-enhance" />}
            right={() => (
              <Switch
                value={autoAnalysis}
                onValueChange={setAutoAnalysis}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* App Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          
          <List.Item
            title="버전"
            description={`v${Constants.manifest?.version || '1.0.0'}`}
            left={props => <List.Icon {...props} icon="information" />}
          />
          
          <Divider />
          
          <List.Item
            title="개발자"
            description="Historical Place Recognition Team"
            left={props => <List.Icon {...props} icon="account-group" />}
          />
          
          <Divider />
          
          <TouchableOpacity onPress={handleContactSupport}>
            <List.Item
              title="고객 지원"
              description="문의사항 및 건의사항"
              left={props => <List.Icon {...props} icon="help-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Legal */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>약관 및 정책</Text>
          
          <TouchableOpacity onPress={handlePrivacyPolicy}>
            <List.Item
              title="개인정보 처리방침"
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </TouchableOpacity>
          
          <Divider />
          
          <TouchableOpacity onPress={handleTermsOfService}>
            <List.Item
              title="서비스 이용약관"
              left={props => <List.Icon {...props} icon="file-document" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Account Actions */}
      {user && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>계정</Text>
            
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
            >
              로그아웃
            </Button>
            
            <Button
              mode="text"
              onPress={handleDeleteAccount}
              style={styles.deleteButton}
              textColor="#f44336"
              icon="delete"
            >
              계정 삭제
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userProvider: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 16,
    borderColor: '#666',
  },
  deleteButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
