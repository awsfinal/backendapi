import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { LocationService } from '../services/LocationService';
import { AuthService } from '../services/AuthService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearbyRestrooms, setNearbyRestrooms] = useState([]);
  const [heritageRecommendations, setHeritageRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeHome();
  }, []);

  const initializeHome = async () => {
    try {
      setLoading(true);
      
      // Get user info
      const currentUser = await AuthService.getStoredUser();
      setUser(currentUser);

      // Get location and load nearby facilities
      await loadLocationAndFacilities();
      
    } catch (error) {
      console.error('Initialize home error:', error);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocationAndFacilities = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 서비스를 사용하려면 위치 권한이 필요합니다.');
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocation(locationData);

      // Load nearby facilities
      await Promise.all([
        loadNearbyRestrooms(locationData),
        loadHeritageRecommendations(locationData)
      ]);

    } catch (error) {
      console.error('Location error:', error);
      // Use default Seoul location if GPS fails
      const defaultLocation = { latitude: 37.5663, longitude: 126.9779 };
      setLocation(defaultLocation);
      
      await Promise.all([
        loadNearbyRestrooms(defaultLocation),
        loadHeritageRecommendations(defaultLocation)
      ]);
    }
  };

  const loadNearbyRestrooms = async (locationData) => {
    try {
      const restrooms = await LocationService.getNearbyRestrooms(
        locationData.latitude,
        locationData.longitude,
        1000 // 1km radius
      );
      setNearbyRestrooms(restrooms.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Load restrooms error:', error);
      setNearbyRestrooms([]);
    }
  };

  const loadHeritageRecommendations = async (locationData) => {
    try {
      const heritage = await LocationService.getHeritageRecommendations(
        locationData.latitude,
        locationData.longitude,
        5000 // 5km radius
      );
      setHeritageRecommendations(heritage.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Load heritage error:', error);
      setHeritageRecommendations([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLocationAndFacilities();
    setRefreshing(false);
  };

  const handleTakePhoto = () => {
    navigation.navigate('Camera');
  };

  const handleViewMap = () => {
    navigation.navigate('Map');
  };

  const handleHeritagePress = (heritage) => {
    navigation.navigate('HeritageDetail', { heritage });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title style={styles.welcomeTitle}>
            안녕하세요, {user?.name || '사용자'}님! 👋
          </Title>
          <Paragraph style={styles.welcomeText}>
            오늘도 새로운 역사적 장소를 발견해보세요
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.actionButtonText}>사진 분석</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleViewMap}>
          <Ionicons name="map" size={32} color="#fff" />
          <Text style={styles.actionButtonText}>지도 보기</Text>
        </TouchableOpacity>
      </View>

      {/* Current Location */}
      {location && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <Title style={styles.sectionTitle}>현재 위치</Title>
            </View>
            <Paragraph>
              위도: {location.latitude.toFixed(4)}, 경도: {location.longitude.toFixed(4)}
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Nearby Restrooms */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color="#2196F3" />
            <Title style={styles.sectionTitle}>주변 화장실</Title>
          </View>
          
          {nearbyRestrooms.length > 0 ? (
            nearbyRestrooms.map((restroom, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{restroom.name}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {restroom.distance}m • {restroom.address}
                  </Text>
                  {restroom.facilities?.wheelchair_accessible && (
                    <Text style={styles.facilityTag}>♿ 휠체어 접근 가능</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Paragraph>주변에 화장실 정보가 없습니다.</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Heritage Recommendations */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="library" size={20} color="#2196F3" />
            <Title style={styles.sectionTitle}>추천 문화재</Title>
          </View>
          
          {heritageRecommendations.length > 0 ? (
            heritageRecommendations.map((heritage, index) => (
              <TouchableOpacity
                key={index}
                style={styles.listItem}
                onPress={() => handleHeritagePress(heritage)}
              >
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{heritage.name}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {heritage.category} • {heritage.distance}m
                  </Text>
                  <Text style={styles.listItemDescription} numberOfLines={2}>
                    {heritage.description || heritage.address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))
          ) : (
            <Paragraph>주변에 문화재 정보가 없습니다.</Paragraph>
          )}
        </Card.Content>
      </Card>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 48) / 2,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  card: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listItemDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  facilityTag: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
});
