import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  Text,
  TouchableOpacity
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Searchbar, FAB, Portal, Modal, Card, Button, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { LocationService } from '../services/LocationService';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const [region, setRegion] = useState({
    latitude: 37.5663, // Default to Seoul City Hall
    longitude: 126.9779,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [userLocation, setUserLocation] = useState(null);
  const [restrooms, setRestrooms] = useState([]);
  const [heritage, setHeritage] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    restrooms: true,
    heritage: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyFacilities(userLocation);
    }
  }, [userLocation, selectedFilters]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 서비스를 사용하려면 위치 권한이 필요합니다.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userPos);
      setRegion({
        ...userPos,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
    }
  };

  const loadNearbyFacilities = async (location) => {
    try {
      setLoading(true);
      
      const promises = [];
      
      if (selectedFilters.restrooms) {
        promises.push(
          LocationService.getNearbyRestrooms(location.latitude, location.longitude, 2000)
            .then(data => setRestrooms(data))
            .catch(error => {
              console.error('Load restrooms error:', error);
              setRestrooms([]);
            })
        );
      } else {
        setRestrooms([]);
      }
      
      if (selectedFilters.heritage) {
        promises.push(
          LocationService.getHeritageRecommendations(location.latitude, location.longitude, 5000)
            .then(data => setHeritage(data))
            .catch(error => {
              console.error('Load heritage error:', error);
              setHeritage([]);
            })
        );
      } else {
        setHeritage([]);
      }
      
      await Promise.all(promises);
      
    } catch (error) {
      console.error('Load facilities error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('검색어 입력', '검색할 장소를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      // Try to geocode the search query first
      try {
        const coordinates = await LocationService.geocodeAddress(searchQuery);
        if (coordinates) {
          const newRegion = {
            ...coordinates,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);
          await loadNearbyFacilities(coordinates);
          return;
        }
      } catch (geocodeError) {
        console.log('Geocoding failed, trying location search');
      }
      
      // If geocoding fails, search for locations
      const searchResults = await LocationService.searchLocations(
        searchQuery,
        region.latitude,
        region.longitude,
        10000
      );
      
      // Update markers with search results
      if (searchResults.heritage_sites?.length > 0) {
        setHeritage(searchResults.heritage_sites);
      }
      if (searchResults.restrooms?.length > 0) {
        setRestrooms(searchResults.restrooms);
      }
      
      if (searchResults.heritage_sites?.length === 0 && searchResults.restrooms?.length === 0) {
        Alert.alert('검색 결과 없음', '검색 결과가 없습니다.');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('검색 오류', '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (item, type) => {
    if (type === 'heritage') {
      navigation.navigate('HeritageDetail', { heritage: item });
    }
  };

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
  };

  const handleMyLocationPress = () => {
    if (userLocation) {
      setRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      getCurrentLocation();
    }
  };

  const toggleFilter = (filterKey) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="장소 검색..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="내 위치"
            pinColor="blue"
          />
        )}

        {/* Restroom Markers */}
        {selectedFilters.restrooms && restrooms.map((restroom, index) => (
          <Marker
            key={`restroom-${index}`}
            coordinate={{
              latitude: restroom.latitude,
              longitude: restroom.longitude,
            }}
            pinColor="green"
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{restroom.name}</Text>
                <Text style={styles.calloutSubtitle}>화장실 • {restroom.distance}m</Text>
                <Text style={styles.calloutAddress}>{restroom.address}</Text>
                {restroom.facilities?.wheelchair_accessible && (
                  <Text style={styles.calloutFacility}>♿ 휠체어 접근 가능</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Heritage Markers */}
        {selectedFilters.heritage && heritage.map((site, index) => (
          <Marker
            key={`heritage-${index}`}
            coordinate={{
              latitude: site.latitude,
              longitude: site.longitude,
            }}
            pinColor="red"
            onPress={() => handleMarkerPress(site, 'heritage')}
          >
            <Callout onPress={() => handleMarkerPress(site, 'heritage')}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{site.name}</Text>
                <Text style={styles.calloutSubtitle}>{site.category} • {site.distance}m</Text>
                <Text style={styles.calloutAddress}>{site.address}</Text>
                <Text style={styles.calloutTap}>탭하여 상세보기</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          selected={selectedFilters.restrooms}
          onPress={() => toggleFilter('restrooms')}
          style={[styles.filterChip, selectedFilters.restrooms && styles.selectedChip]}
          textStyle={selectedFilters.restrooms && styles.selectedChipText}
        >
          🚻 화장실
        </Chip>
        <Chip
          selected={selectedFilters.heritage}
          onPress={() => toggleFilter('heritage')}
          style={[styles.filterChip, selectedFilters.heritage && styles.selectedChip]}
          textStyle={selectedFilters.heritage && styles.selectedChipText}
        >
          🏛️ 문화재
        </Chip>
      </View>

      {/* My Location FAB */}
      <FAB
        style={styles.myLocationFab}
        icon="crosshairs-gps"
        onPress={handleMyLocationPress}
        color="#fff"
      />

      {/* Refresh FAB */}
      <FAB
        style={styles.refreshFab}
        icon="refresh"
        onPress={() => userLocation && loadNearbyFacilities(userLocation)}
        loading={loading}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  searchBar: {
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  filterContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    flexDirection: 'row',
    zIndex: 1,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#fff',
  },
  selectedChip: {
    backgroundColor: '#2196F3',
  },
  selectedChipText: {
    color: '#fff',
  },
  myLocationFab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: '#2196F3',
  },
  refreshFab: {
    position: 'absolute',
    right: 16,
    bottom: 40,
    backgroundColor: '#4CAF50',
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  calloutFacility: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: 'bold',
  },
  calloutTap: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
